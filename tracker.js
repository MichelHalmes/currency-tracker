#!/usr/bin/env node
const unirest = require('unirest');
const assert = require('assert');


const URL = 'https://finance.yahoo.com/webservice/v1/symbols/allcurrencies/quote?format=json'
unirest.get(URL)
  .send()
  .end(response => {
  if (response.ok) {
    let resources = response.body.list.resources.map((rsrc) => rsrc.resource.fields)
    resources = resources.filter((rsrc) => (rsrc.name == "USD/EUR" || rsrc.name =="USD/ZAR"))

    assert(resources[0].name == "USD/ZAR")
    let usd_zar = resources[0].price

    assert(resources[1].name == "USD/EUR")
    let usd_eur = resources[1].price

    let eur_zar = usd_zar/usd_eur

  	console.log("Got a response: ", eur_zar)
    return eur_zar
  } else {
  	console.log("Got an error: ", response.error)
  }
  })












