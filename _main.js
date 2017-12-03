import SlackClient from './slack_client'
import rp from 'request-promise'
import assert from 'assert'
import XMLparser from 'xml-parser'



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
      console.log("Downloaded HTML:", html_text.substr(1,10000))
      const HTML_HEADER = '<!doctype html>'
      const XML_HEADER = '<?xml version="1.0" encoding="utf-8"?>'
      html_text = html_text.replace(HTML_HEADER, XML_HEADER)
      
      var parsedXML = XMLparser(html_text);
      parsedXML = parsedXML.root.children[0]
      console.log(parsedXML)
    })
  
  
// Promise.all([eur_zar_p])
//   .then(results => {
//     let slack = new SlackClient()
//     var eur_zar = results[0]
//     slack.sendSlackMessage(`Current rate is ${eur_zar.toFixed(2)} ZAR/EUR`)
//     slack.close()
// 
//   })