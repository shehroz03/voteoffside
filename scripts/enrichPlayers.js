import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PLAYERS_FILE = path.join(__dirname, '../src/data/players.json')

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function enrichPlayers() {
  console.log('Reading players.json...')
  const data = JSON.parse(fs.readFileSync(PLAYERS_FILE, 'utf-8'))
  const players = data.players

  let updatedCount = 0

  for (const player of players) {
    if (player.photo) {
      console.log(`Skipping ${player.name}, already has photo.`)
      continue
    }

    try {
      console.log(`Fetching data for ${player.name}...`)
      // Free API endpoint version 3
      const res = await fetch(`https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(player.name)}`)
      if (!res.ok) {
        console.warn(`HTTP Error ${res.status} for ${player.name}`)
        continue
      }

      const json = await res.json()
      if (json.player && json.player.length > 0) {
        // Use the first match's cutout or thumb
        const pData = json.player[0]
        const photoUrl = pData.strCutout || pData.strThumb
        if (photoUrl) {
          player.photo = photoUrl
          updatedCount++
          console.log(`✅ Found photo for ${player.name}`)
        } else {
          console.log(`❌ No photo found for ${player.name}`)
        }
      } else {
        console.log(`❌ Player not found in TheSportsDB: ${player.name}`)
      }
    } catch (err) {
      console.error(`Error fetching ${player.name}:`, err.message)
    }

    // Rate limiting for free API (e.g. 1 request per second)
    await sleep(1000)
  }

  if (updatedCount > 0) {
    fs.writeFileSync(PLAYERS_FILE, JSON.stringify(data, null, 2))
    console.log(`\n🎉 Success! Added photos for ${updatedCount} players.`)
  } else {
    console.log('\nNo new photos were added.')
  }
}

enrichPlayers()
