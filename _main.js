import SlackClient from './slack_client'
import rp from 'request-promise'
import assert from 'assert'


const FINANCE_URL = 'https://finance.yahoo.com/webservice/v1/symbols/allcurrencies/quote?format=json'
rp(FINANCE_URL, {json: true})
  .then(res => {
    let resources = res.list.resources.map((rsrc) => rsrc.resource.fields)
    resources = resources.filter((rsrc) => (rsrc.name == "USD/EUR" || rsrc.name == "USD/ZAR"))

    assert(resources[0].name == "USD/ZAR")
    let usd_zar = resources[0].price

    assert(resources[1].name == "USD/EUR")
    let usd_eur = resources[1].price

    let eur_zar = usd_zar/usd_eur

    console.log("Got a res: ", eur_zar)
    return eur_zar
  })
  .then(eur_zar => {
    let slack = new SlackClient()
    slack.sendSlackMessage(`Current rate is ${eur_zar.toFixed(2)} ZAR/EUR`)
    slack.close()

  })