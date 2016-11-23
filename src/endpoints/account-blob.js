import flow from 'promise-control-flow'
import flat from 'flat'
import _get from 'lodash.get'

export default function (client) {
  const data = {
    account: wrap(() => client.account().get()),
    achievements: wrap(() => client.account().achievements().get()),
    bank: wrap(() => client.account().bank().get()),
    characters: wrap(() => client.characters().all()),
    'commerce.buys': wrap(() => client.commerce().transactions().current().buys().all()),
    'commerce.sells': wrap(() => client.commerce().transactions().current().sells().all()),
    dyes: wrap(() => client.account().dyes().get()),
    finishers: wrap(() => client.account().finishers().get()),
    guilds: wrap(() => accountGuilds(client)),
    inventory: wrap(() => client.account().inventory().get()),
    materials: wrap(() => client.account().materials().get()),
    minis: wrap(() => client.account().minis().get()),
    outfits: wrap(() => client.account().outfits().get()),
    'pvp.games': wrap(() => client.account().pvp().games().all()),
    'pvp.standings': wrap(() => client.account().pvp().standings().get()),
    'pvp.stats': wrap(() => client.account().pvp().stats().get()),
    recipes: wrap(() => client.account().recipes().get()),
    skins: wrap(() => client.account().skins().get()),
    titles: wrap(() => client.account().titles().get()),
    wallet: wrap(() => client.account().wallet().get())
  }

  return flow.parallel(data).then(x => flat.unflatten(x))
}

// Get the guild data accessible for the account
function accountGuilds (client) {
  return client.account().get().then(account => {
    let requests = account.guilds.map(id => wrap(() => guildData(id)))
    return flow.parallel(requests)
  })

  function guildData (id) {
    let requests = {
      data: wrap(() => client.guild().get(id)),
      members: wrap(() => client.guild(id).members().get()),
      ranks: wrap(() => client.guild(id).ranks().get()),
      stash: wrap(() => client.guild(id).stash().get()),
      teams: wrap(() => client.guild(id).teams().get()),
      treasury: wrap(() => client.guild(id).treasury().get()),
      upgrades: wrap(() => client.guild(id).upgrades().get())
    }

    return flow.parallel(requests)
  }
}

// Wrap a promise function so all errors that have to do with API permissions
// just result in an empty response instead of throwing an error
function wrap (func) {
  return () => new Promise((resolve, reject) => {
    func()
      .then(x => resolve(x))
      .catch(err => {
        let status = _get(err, 'response.status')
        let text = _get(err, 'content.text')

        if (status === 403 || text === 'access restricted to guild leaders') {
          return resolve(null)
        }

        reject(err)
      })
  })
}