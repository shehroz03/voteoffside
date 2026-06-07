import data from '../data/players.json'

export const players = data.players

const byId = Object.fromEntries(players.map((p) => [p.id, p]))

export function getPlayer(id) {
  return byId[id]
}

export const positions = ['FW', 'MF', 'DF', 'GK']
