import SlackClient from './slack_client'
import rp from 'request-promise'
import assert from 'assert'
import htmlparser from 'htmlparser2'



const FINANCE_URL = 'https://finance.yahoo.com/webservice/v1/symbols/allcurrencies/quote?format=json'
var eur_zar_p = rp(FINANCE_URL, {json: true})
  .then(res => {
    let resources = res.list.resources.map((rsrc) => rsrc.resource.fields)
    resources = resources.filter((rsrc) => (rsrc.name == "USD/EUR" || rsrc.name == "USD/ZAR"))

    assert(resources[0].name == "USD/ZAR")
    let usd_zar = resources[0].price

    assert(resources[1].name == "USD/EUR")
    let usd_eur = resources[1].price

    let eur_zar = usd_zar/usd_eur

    console.log("Current X-rate: ", eur_zar)
    return eur_zar
  })

const SANPARKS_URL = 'https://www.sanparks.org/parks/garden_route/camps/storms_river/tourism/availability_dates.php'
const OTTER_PARAMS = {
  only_trails: 'otter',
  range: 'month',
  from_date: '2017-11-02',
  to_date: '2018-11-30',
  resort: 26,
  unit_id: 26,
  id: 396,
  action: 'submit'
}

var request_url = SANPARKS_URL + '?'
request_url+= Object.keys(OTTER_PARAMS).map(k => `${k}=${OTTER_PARAMS[k]}`).join('&')
console.log(request_url)
var otter_p = rp(request_url, {json: true})
  .then(html_text => {
    console.log("Downloaded HTML:", html_text.substr(1,1000))

    return new Promise((resolve, reject) => {
      var handler = new htmlparser.DomHandler((error, dom) => {
          console.log("Parsed DOM!")
          error ? reject(false) : resolve(dom)
      }, {normalizeWhitespace: true})
      var parser = new htmlparser.Parser(handler);
      parser.write(html_text);
      parser.end();
    })
  })
  .then(dom => {
    var availability_dom = dom
        .filter(e => e.name == 'html')[0]
        .children
        .filter(e => e.name == 'body')[0]
        .children
        .filter(e => e.name == 'main')[0]
        .children
        .filter(e => e.name == 'div')[0]
        .children
        .filter(e => e.name == 'div')[0]
        .children
        .filter(e => e.name == 'div')[0]
        .children
        .filter(e => e.name == 'div')[0]
        .children
        .filter(e => e.name == 'section')[1]
        .children
    // console.log(availability_dom)

    var uploaded_dates = availability_dom
        .filter(e => e.name == 'form' && e.attribs.id == 'fromToAvailabilityCheck')[0]
        .children
        .filter(e => e.name == 'fieldset')[0]
        .children
        .filter(e => e.name == 'select' && e.attribs.id == 'from_date')[0]
        .children
        .filter(e => e.name == 'option')
        .map(e => e.attribs.value)
    // console.log(uploaded_dates)

    var available_spots = availability_dom
        .filter(e => e.name == 'div' && e.attribs.id == 'results')[0]
        .children
        .filter(e => e.name == 'div')[0]
        .children
        .filter(e => e.name == 'div')[0]
        .children
        .filter(e => e.name == 'table')[0]
        .children
        .filter(e => e.name == 'tr')
        .map(e => ({date: e.children[0].children, nb_spots: e.children[2].children}))
        .filter(o => o.nb_spots && o.nb_spots.length)
        .map(o => ({date: o.date[0].data, nb_spots: o.nb_spots[0].data}))
    // console.log(available_spots)

    return {uploaded_dates, available_spots}
  })


const ALERT_EUR_ZAR_ABOVE = 16.5
const MIN_SPOTS_AVAIL = 4
const IGNORE_MONTHS = ['january', 'may', 'june', 'july', 'august', 'september']
const IGNORE_DATES =['07 february 2018']

Promise.all([eur_zar_p]) //, otter_p])
  .then(results => {
    let slack = new SlackClient()
    const MICHEL_CHNL = process.env.MICHEL_CHANNEL
    const LOG_CHNL = process.env.LOG_CHANNEL

    var eur_zar = results[0]
    var channel = eur_zar > ALERT_EUR_ZAR_ABOVE ? MICHEL_CHNL : LOG_CHNL
    slack.sendSlackMessage(`Current rate is ${eur_zar.toFixed(2)} ZAR/EUR`, channel)

    var otter_avail = results[1]
    var last_date = otter_avail.uploaded_dates
                        .reduce((acc, curr) => curr > acc ? curr : acc, '')
    channel = last_date > OTTER_PARAMS.to_date ? MICHEL_CHNL : LOG_CHNL
    slack.sendSlackMessage(`Otter-dates uploaded until: ${last_date}`, channel)
    var interesting_spots = otter_avail.available_spots
                        .filter(s => (
                          s.nb_spots >= MIN_SPOTS_AVAIL &&
                          IGNORE_MONTHS.indexOf(s.date.substr(3, s.date.length-8).toLowerCase()) == -1 &&
                          IGNORE_DATES.indexOf(s.date.toLowerCase()) == -1
                        ))

    if (interesting_spots.length) {
      var message = `Interesting spots available:\n`
      message += interesting_spots.map(s => ` * ${s.date}: ${s.nb_spots}`).join('\n')
      slack.sendSlackMessage(message, MICHEL_CHNL)
    } else {
      slack.sendSlackMessage(`No interesting otter-spots available :-(`, LOG_CHNL)
    }

    slack.close()

  })
