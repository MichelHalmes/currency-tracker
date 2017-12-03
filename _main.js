import SlackClient from './slack_client'
import rp from 'request-promise'
import assert from 'assert'
import htmlparser from 'htmlparser2'



// const FINANCE_URL = 'https://finance.yahoo.com/webservice/v1/symbols/allcurrencies/quote?format=json'
// var eur_zar_p = rp(FINANCE_URL, {json: true})
//   .then(res => {
//     let resources = res.list.resources.map((rsrc) => rsrc.resource.fields)
//     resources = resources.filter((rsrc) => (rsrc.name == "USD/EUR" || rsrc.name == "USD/ZAR"))
// 
//     assert(resources[0].name == "USD/ZAR")
//     let usd_zar = resources[0].price
// 
//     assert(resources[1].name == "USD/EUR")
//     let usd_eur = resources[1].price
// 
//     let eur_zar = usd_zar/usd_eur
// 
//     console.log("Current X-rate: ", eur_zar)
//     return eur_zar
//   })
  
  const SANPARKS_URL = 'https://www.sanparks.org/parks/garden_route/camps/storms_river/tourism/availability_dates.php'
  const PARAMETERS = {
    only_trails: 'otter',
    range: 'month',
    from_date: '2018-04-02',
    to_date: '2018-11-28',
    resort: 26,
    unit_id: 26,
    id: 396,
    action: 'submit'
  }
  
  var request_url = SANPARKS_URL + '?' 
  request_url+= Object.keys(PARAMETERS).map(k => `${k}=${PARAMETERS[k]}`).join('&')
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
                
      console.log(availability_dom)
      var dates = availability_dom
          .filter(e => e.name == 'form' && e.attribs.id == 'fromToAvailabilityCheck')[0]
          .children
          .filter(e => e.name == 'fieldset')[0]
          .children
          .filter(e => e.name == 'select' && e.attribs.id == 'from_date')[0]
          .children
          .filter(e => e.name == 'option')
          .map(e => e.attribs.value)
          
      console.log(dates)
    })
  
  
// Promise.all([eur_zar_p])
//   .then(results => {
//     let slack = new SlackClient()
//     var eur_zar = results[0]
//     slack.sendSlackMessage(`Current rate is ${eur_zar.toFixed(2)} ZAR/EUR`)
//     slack.close()
// 
//   })