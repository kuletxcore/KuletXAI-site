// Generated from public IsekaiZero and KageSekai storyline data. Re-run build_isk.py to refresh.
export type IskCast = { id: string; name: string; summary: string; rating: string; role: "persona" | "character"; portrait?: string; card?: string }
export type IskMedia = { type: "image" | "video"; src: string; thumb?: string; w: number; h: number; caption: string }
export type IskStory = { videoCover?: string; introCard?: string; cast: IskCast[]; gallery: IskMedia[] }

export const ISK: Record<string, IskStory> = {
  "acolytes": {
    "cast": [
      {
        "id": "6aa9130cbda2b3fef5ba8e8d",
        "name": "Rin Aoyama",
        "summary": "Team leader of Acolyte Consultancy. Tomboyish, thrill-seeking, and sharper than she lets on. Runs the squad, the café, and the night’s real work.",
        "rating": "m17",
        "role": "persona",
        "portrait": "/isk/acolytes/cast/6aa9130cbda2b3fef5ba8e8d.webp",
        "card": "/isk/acolytes/cards/6aa9130cbda2b3fef5ba8e8d.html?v=a48f6d38"
      },
      {
        "id": "6aede2da070968d7a79850ec",
        "name": "Josefina Jones",
        "summary": "Agent 00 of the Acolyte Consultancy. On the café floor she is just Jo; in the field every op plan answers to her.",
        "rating": "m17",
        "role": "persona",
        "portrait": "/isk/acolytes/cast/6aede2da070968d7a79850ec.webp",
        "card": "/isk/acolytes/cards/6aede2da070968d7a79850ec.html?v=6dcd636f"
      },
      {
        "id": "6aa9162d3e6d56af8773211b",
        "name": "Hana Morishita",
        "summary": "Agent 01. The squad’s luckiest operator and quiet tactician. Joined for the café job. Stayed because she turned out to be dangerously good at the other half.",
        "rating": "m17",
        "role": "character",
        "portrait": "/isk/acolytes/cast/6aa9162d3e6d56af8773211b.webp",
        "card": "/isk/acolytes/cards/6aa9162d3e6d56af8773211b.html?v=9995e7ed"
      },
      {
        "id": "6aa917f77f8d763ffaf18e3a",
        "name": "Sasha Quinn",
        "summary": "Agent 02. The squad’s long-range specialist. Quiet on the clock, dry off it. Calls the team lead “Boss” and means it.",
        "rating": "m17",
        "role": "character",
        "portrait": "/isk/acolytes/cast/6aa917f77f8d763ffaf18e3a.webp",
        "card": "/isk/acolytes/cards/6aa917f77f8d763ffaf18e3a.html?v=43ae1bca"
      },
      {
        "id": "6aa918c148ef1abab022fc3d",
        "name": "Mira Solis",
        "summary": "Agent 03. Breacher and combat medic. The squad’s steadiness. Opens doors, patches people up, and makes sure everyone gets home.",
        "rating": "m17",
        "role": "character",
        "portrait": "/isk/acolytes/cast/6aa918c148ef1abab022fc3d.webp",
        "card": "/isk/acolytes/cards/6aa918c148ef1abab022fc3d.html?v=45b06613"
      },
      {
        "id": "6aa91a1b4cc214a73c9ce806",
        "name": "Yui Takamoto",
        "summary": "Agent 04. The wildcard — three prototypes, an exo-suit, and the ridiculous option already in hand. Peace-peace.",
        "rating": "m17",
        "role": "character",
        "portrait": "/isk/acolytes/cast/6aa91a1b4cc214a73c9ce806.webp",
        "card": "/isk/acolytes/cards/6aa91a1b4cc214a73c9ce806.html?v=7e6a68e3"
      }
    ],
    "gallery": [
      {
        "type": "image",
        "src": "/isk/acolytes/gallery/6add6aa54b1ddd7dae97fa56.webp",
        "thumb": "/isk/acolytes/gallery/thumbs/6add6aa54b1ddd7dae97fa56.webp",
        "w": 848,
        "h": 1264,
        "caption": "Rin Aoyama cover variant"
      },
      {
        "type": "image",
        "src": "/isk/acolytes/gallery/6aaa017375a76da9554f25d4.webp",
        "thumb": "/isk/acolytes/gallery/thumbs/6aaa017375a76da9554f25d4.webp",
        "w": 768,
        "h": 1344,
        "caption": "The café floor, morning before opening — sunlight, chalkboard, kettle warming"
      },
      {
        "type": "image",
        "src": "/isk/acolytes/gallery/6aaa01fe35dcb964f84449f1.webp",
        "thumb": "/isk/acolytes/gallery/thumbs/6aaa01fe35dcb964f84449f1.webp",
        "w": 720,
        "h": 1280,
        "caption": "The café floor at midday rush — full room, steam, warm haze"
      },
      {
        "type": "image",
        "src": "/isk/acolytes/gallery/6aaa022f31ec3accae6cc482.webp",
        "thumb": "/isk/acolytes/gallery/thumbs/6aaa022f31ec3accae6cc482.webp",
        "w": 768,
        "h": 1344,
        "caption": "The café floor after close — chairs up, one lamp, blue hour outside"
      },
      {
        "type": "image",
        "src": "/isk/acolytes/gallery/6aaa02949d34177249fe6549.webp",
        "thumb": "/isk/acolytes/gallery/thumbs/6aaa02949d34177249fe6549.webp",
        "w": 768,
        "h": 1344,
        "caption": "The briefing room — screen map, gear lockers, dim lights"
      },
      {
        "type": "image",
        "src": "/isk/acolytes/gallery/6aaa02ee126bf8b7b088ea1e.webp",
        "thumb": "/isk/acolytes/gallery/thumbs/6aaa02ee126bf8b7b088ea1e.webp",
        "w": 896,
        "h": 1152,
        "caption": "The armory — lockers, manifest, sign-out counter"
      },
      {
        "type": "image",
        "src": "/isk/acolytes/gallery/6aaa03709d34177249fea3b6.webp",
        "thumb": "/isk/acolytes/gallery/thumbs/6aaa03709d34177249fea3b6.webp",
        "w": 787,
        "h": 1400,
        "caption": "The monitor loft — feeds, scanner, red-string board"
      },
      {
        "type": "image",
        "src": "/isk/acolytes/gallery/6aaa03eac8f6aa87eb727533.webp",
        "thumb": "/isk/acolytes/gallery/thumbs/6aaa03eac8f6aa87eb727533.webp",
        "w": 768,
        "h": 1344,
        "caption": "The quiet block — shopfronts, café window glowing, late gold"
      },
      {
        "type": "image",
        "src": "/isk/acolytes/gallery/6aaa045b126bf8b7b089539a.webp",
        "thumb": "/isk/acolytes/gallery/thumbs/6aaa045b126bf8b7b089539a.webp",
        "w": 768,
        "h": 1344,
        "caption": "The back alley — the steel door, the caged bulb, dusk"
      },
      {
        "type": "image",
        "src": "/isk/acolytes/gallery/6aaa05058cea37e1942b8074.webp",
        "thumb": "/isk/acolytes/gallery/thumbs/6aaa05058cea37e1942b8074.webp",
        "w": 787,
        "h": 1400,
        "caption": "Warehouse district at night — containers, sodium lamps, fog"
      },
      {
        "type": "image",
        "src": "/isk/acolytes/gallery/6aaa054a31ec3accae6d751c.webp",
        "thumb": "/isk/acolytes/gallery/thumbs/6aaa054a31ec3accae6d751c.webp",
        "w": 768,
        "h": 1344,
        "caption": "Rooftop overwatch at night — parapet, case, city below"
      },
      {
        "type": "image",
        "src": "/isk/acolytes/gallery/6aa93549a3923490582eef04.webp",
        "thumb": "/isk/acolytes/gallery/thumbs/6aa93549a3923490582eef04.webp",
        "w": 864,
        "h": 1152,
        "caption": "OG Main Cover"
      },
      {
        "type": "video",
        "src": "/isk/acolytes/gallery/6aacaa2b9b355299e43c4158.mp4",
        "w": 560,
        "h": 752,
        "caption": "OG animated cover"
      },
      {
        "type": "image",
        "src": "/isk/acolytes/gallery/6ae332cf31da3b20a532273e.webp",
        "thumb": "/isk/acolytes/gallery/thumbs/6ae332cf31da3b20a532273e.webp",
        "w": 787,
        "h": 1400,
        "caption": "bright multi-floor mall with a skylight, escalators and glass storefronts."
      },
      {
        "type": "image",
        "src": "/isk/acolytes/gallery/6ae332cf31da3b20a532273f.webp",
        "thumb": "/isk/acolytes/gallery/thumbs/6ae332cf31da3b20a532273f.webp",
        "w": 787,
        "h": 1400,
        "caption": "rainy lantern-lit food stalls with steam and neon signs."
      },
      {
        "type": "image",
        "src": "/isk/acolytes/gallery/6ae332cf31da3b20a5322740.webp",
        "thumb": "/isk/acolytes/gallery/thumbs/6ae332cf31da3b20a5322740.webp",
        "w": 787,
        "h": 1400,
        "caption": "dim lived-in safehouse apartment at night with warm desk lamp, wall of taped maps and notes, a sofa, and city lights through window blinds."
      },
      {
        "type": "image",
        "src": "/isk/acolytes/gallery/6ae332cf31da3b20a5322741.webp",
        "thumb": "/isk/acolytes/gallery/thumbs/6ae332cf31da3b20a5322741.webp",
        "w": 787,
        "h": 1400,
        "caption": "open concrete rooftop at sunset with water tank, antennas, and a sprawling city skyline under an orange-violet sky."
      },
      {
        "type": "image",
        "src": "/isk/acolytes/gallery/6ae332cf31da3b20a5322742.webp",
        "thumb": "/isk/acolytes/gallery/thumbs/6ae332cf31da3b20a5322742.webp",
        "w": 787,
        "h": 1400,
        "caption": "empty late-night commuter train carriage with blue seats, hanging straps, cold fluorescent lights, and city lights streaking past the windows."
      },
      {
        "type": "image",
        "src": "/isk/acolytes/gallery/6ae332d631da3b20a5322c6b.webp",
        "thumb": "/isk/acolytes/gallery/thumbs/6ae332d631da3b20a5322c6b.webp",
        "w": 787,
        "h": 1400,
        "caption": "rainy neon-lit downtown alley at night with glowing signs, vending machines, izakaya lanterns, and wet pavement reflecting pink and teal light."
      },
      {
        "type": "image",
        "src": "/isk/acolytes/gallery/6ae332d731da3b20a5322d68.webp",
        "thumb": "/isk/acolytes/gallery/thumbs/6ae332d731da3b20a5322d68.webp",
        "w": 787,
        "h": 1400,
        "caption": "damp industrial harbor at pre-dawn, with stacked shipping containers, looming grain silos, and wet pavement reflecting amber lights in sea fog."
      },
      {
        "type": "video",
        "src": "/isk/acolytes/gallery/6aa934b42024b5b8e98b2275.mp4",
        "w": 560,
        "h": 752,
        "caption": "Secondary animated cover art"
      }
    ],
    "videoCover": "/isk/acolytes/cover.mp4?v=62a7b850",
    "introCard": "/isk/acolytes/cards/intro.html?v=adeff88b"
  },
  "colossus-protocol": {
    "cast": [
      {
        "id": "6aa60206db7d2a53541a698d",
        "name": "Cordelia Grace",
        "summary": "Sole survivor of the 214. Coast Guard rescue swimmer turned Colossus Actual. The only thing in the world that can meet what's coming out of the rifts at eye level.",
        "rating": "m17",
        "role": "persona",
        "portrait": "/isk/colossus-protocol/cast/6aa60206db7d2a53541a698d.webp",
        "card": "/isk/colossus-protocol/cards/6aa60206db7d2a53541a698d.html?v=78b875c2"
      },
      {
        "id": "6aa61d71ef4f47ff9d10c887",
        "name": "Reyes",
        "summary": "RRD ground-station handler, assigned to Colossus Actual since her release from the sealed ward. Former burn-ward officer before transferring to Field Coordination.",
        "rating": "sfw",
        "role": "character",
        "portrait": "/isk/colossus-protocol/cast/6aa61d71ef4f47ff9d10c887.webp",
        "card": "/isk/colossus-protocol/cards/6aa61d71ef4f47ff9d10c887.html?v=b6ed53da"
      }
    ],
    "gallery": [
      {
        "type": "image",
        "src": "/isk/colossus-protocol/gallery/6aaa123d31ec3accae709a0f.webp",
        "thumb": "/isk/colossus-protocol/gallery/thumbs/6aaa123d31ec3accae709a0f.webp",
        "w": 896,
        "h": 1152,
        "caption": "in the evacuation corridor at street level, sirens, morning"
      },
      {
        "type": "image",
        "src": "/isk/colossus-protocol/gallery/6aaa12e835dcb964f8481a3e.webp",
        "thumb": "/isk/colossus-protocol/gallery/thumbs/6aaa12e835dcb964f8481a3e.webp",
        "w": 768,
        "h": 1344,
        "caption": "the bay has receded, exposed seabed before an emergence"
      },
      {
        "type": "image",
        "src": "/isk/colossus-protocol/gallery/6ab17a8d93591cf5de364db6.webp",
        "thumb": "/isk/colossus-protocol/gallery/thumbs/6ab17a8d93591cf5de364db6.webp",
        "w": 768,
        "h": 1344,
        "caption": "in the ruined Harbor District at night, aftermath of a maximum-scale engagement"
      },
      {
        "type": "image",
        "src": "/isk/colossus-protocol/gallery/6ab17b38da7098f0dcbb1f2d.webp",
        "thumb": "/isk/colossus-protocol/gallery/thumbs/6ab17b38da7098f0dcbb1f2d.webp",
        "w": 896,
        "h": 1152,
        "caption": "GODFREY dossier"
      },
      {
        "type": "image",
        "src": "/isk/colossus-protocol/gallery/6ab17bc08b92e3864225158c.webp",
        "thumb": "/isk/colossus-protocol/gallery/thumbs/6ab17bc08b92e3864225158c.webp",
        "w": 896,
        "h": 1152,
        "caption": "HADAL Dossier"
      },
      {
        "type": "image",
        "src": "/isk/colossus-protocol/gallery/6ab17c11e274677422c1909c.webp",
        "thumb": "/isk/colossus-protocol/gallery/thumbs/6ab17c11e274677422c1909c.webp",
        "w": 896,
        "h": 1152,
        "caption": "ECHO dossier"
      },
      {
        "type": "image",
        "src": "/isk/colossus-protocol/gallery/6ab1e29cd3215bf4e96956c0.webp",
        "thumb": "/isk/colossus-protocol/gallery/thumbs/6ab1e29cd3215bf4e96956c0.webp",
        "w": 768,
        "h": 1344,
        "caption": "at the old ferry terminal plaza, her growth site"
      },
      {
        "type": "image",
        "src": "/isk/colossus-protocol/gallery/6ab1e2c936fa6b341237f3fc.webp",
        "thumb": "/isk/colossus-protocol/gallery/thumbs/6ab1e2c936fa6b341237f3fc.webp",
        "w": 768,
        "h": 1344,
        "caption": "inside the ground station during an engagement"
      },
      {
        "type": "image",
        "src": "/isk/colossus-protocol/gallery/6ab1e33b36fa6b3412380ac9.webp",
        "thumb": "/isk/colossus-protocol/gallery/thumbs/6ab1e33b36fa6b3412380ac9.webp",
        "w": 768,
        "h": 1344,
        "caption": "during a night engagement in the harbor district"
      },
      {
        "type": "image",
        "src": "/isk/colossus-protocol/gallery/6ab1e7eead3bd4375b34d853.webp",
        "thumb": "/isk/colossus-protocol/gallery/thumbs/6ab1e7eead3bd4375b34d853.webp",
        "w": 787,
        "h": 1400,
        "caption": "inside RRD command during an engagement"
      },
      {
        "type": "image",
        "src": "/isk/colossus-protocol/gallery/6ab1e65fad3bd4375b348825.webp",
        "thumb": "/isk/colossus-protocol/gallery/thumbs/6ab1e65fad3bd4375b348825.webp",
        "w": 787,
        "h": 1400,
        "caption": "the rift open over the bay, the deep contact moving"
      },
      {
        "type": "image",
        "src": "/isk/colossus-protocol/gallery/6ab1e79d8b92e386423f3300.webp",
        "thumb": "/isk/colossus-protocol/gallery/thumbs/6ab1e79d8b92e386423f3300.webp",
        "w": 787,
        "h": 1400,
        "caption": "at the quarterly measurement, medical wing"
      },
      {
        "type": "image",
        "src": "/isk/colossus-protocol/gallery/6ab1e756ad3bd4375b34b929.webp",
        "thumb": "/isk/colossus-protocol/gallery/thumbs/6ab1e756ad3bd4375b34b929.webp",
        "w": 787,
        "h": 1400,
        "caption": "at giant scale, eye level with the high-rise district"
      },
      {
        "type": "image",
        "src": "/isk/colossus-protocol/gallery/6ab1e70cdbfe6117104aad2a.webp",
        "thumb": "/isk/colossus-protocol/gallery/thumbs/6ab1e70cdbfe6117104aad2a.webp",
        "w": 787,
        "h": 1400,
        "caption": "inside an evacuation shelter during an alert"
      },
      {
        "type": "image",
        "src": "/isk/colossus-protocol/gallery/6ab1e6a42f8b87f17b71dc57.webp",
        "thumb": "/isk/colossus-protocol/gallery/thumbs/6ab1e6a42f8b87f17b71dc57.webp",
        "w": 787,
        "h": 1400,
        "caption": "on the ground-station rooftop overlooking the bay"
      },
      {
        "type": "image",
        "src": "/isk/colossus-protocol/gallery/6ab1e4701c21125e56124e34.webp",
        "thumb": "/isk/colossus-protocol/gallery/thumbs/6ab1e4701c21125e56124e34.webp",
        "w": 768,
        "h": 1344,
        "caption": "RRD debrief room after an engagement"
      },
      {
        "type": "image",
        "src": "/isk/colossus-protocol/gallery/6ab1e4f3eabb19c120560d0e.webp",
        "thumb": "/isk/colossus-protocol/gallery/thumbs/6ab1e4f3eabb19c120560d0e.webp",
        "w": 768,
        "h": 1344,
        "caption": "flashback — the sealed burn ward, night"
      },
      {
        "type": "image",
        "src": "/isk/colossus-protocol/gallery/6ab1e5738b92e386423ea2be.webp",
        "thumb": "/isk/colossus-protocol/gallery/thumbs/6ab1e5738b92e386423ea2be.webp",
        "w": 787,
        "h": 1400,
        "caption": "on the Harbor Bridge during evacuation"
      },
      {
        "type": "image",
        "src": "/isk/colossus-protocol/gallery/6ab1e8591056f02fb5080d69.webp",
        "thumb": "/isk/colossus-protocol/gallery/thumbs/6ab1e8591056f02fb5080d69.webp",
        "w": 787,
        "h": 1400,
        "caption": "at the pool annex on a recovery night"
      },
      {
        "type": "image",
        "src": "/isk/colossus-protocol/gallery/6ab1e9114a14d4898d4ba0b6.webp",
        "thumb": "/isk/colossus-protocol/gallery/thumbs/6ab1e9114a14d4898d4ba0b6.webp",
        "w": 768,
        "h": 1344,
        "caption": "at a Containment Board hearing"
      },
      {
        "type": "image",
        "src": "/isk/colossus-protocol/gallery/6ab1e96bd3215bf4e96af96d.webp",
        "thumb": "/isk/colossus-protocol/gallery/thumbs/6ab1e96bd3215bf4e96af96d.webp",
        "w": 787,
        "h": 1400,
        "caption": "in her apartment at night"
      },
      {
        "type": "image",
        "src": "/isk/colossus-protocol/gallery/6ab1e9bc2ff6593cc4df66e0.webp",
        "thumb": "/isk/colossus-protocol/gallery/thumbs/6ab1e9bc2ff6593cc4df66e0.webp",
        "w": 768,
        "h": 1344,
        "caption": "on the breakwater at night, watching the water"
      },
      {
        "type": "image",
        "src": "/isk/colossus-protocol/gallery/6ab1ea0dad138ef0aa3a568d.webp",
        "thumb": "/isk/colossus-protocol/gallery/thumbs/6ab1ea0dad138ef0aa3a568d.webp",
        "w": 787,
        "h": 1400,
        "caption": "during an engagement in heavy rain"
      },
      {
        "type": "image",
        "src": "/isk/colossus-protocol/gallery/6ac1eda9e111da1b46d3e5a1.webp",
        "thumb": "/isk/colossus-protocol/gallery/thumbs/6ac1eda9e111da1b46d3e5a1.webp",
        "w": 787,
        "h": 1400,
        "caption": "Harbor Bridge span empty after evacuation, morning"
      }
    ],
    "videoCover": "/isk/colossus-protocol/cover.mp4?v=27bef45b",
    "introCard": "/isk/colossus-protocol/cards/intro.html?v=a2a28687"
  },
  "queen-bee": {
    "cast": [
      {
        "id": "6a9e3c1c2dca1fb6fca472c4",
        "name": "Aurelia Croft",
        "summary": "First-year head of The Vanguard. Old money made flesh. Composed, precise, quietly warmer than she lets on. The hierarchy's most legitimate face — and its most private one.",
        "rating": "sfw",
        "role": "character",
        "portrait": "/isk/queen-bee/cast/6a9e3c1c2dca1fb6fca472c4.webp",
        "card": "/isk/queen-bee/cards/6a9e3c1c2dca1fb6fca472c4.html?v=35dcd231"
      },
      {
        "id": "6a9d7368a7f26b6487ee9ca7",
        "name": "Jax Mercer",
        "summary": "The Wolf of Kingsmere. Runs Wreckage like family: loud, loyal, unstoppable. Lost the challenge of the decade, served the Queen anyway, never once slowed down.",
        "rating": "sfw",
        "role": "character",
        "portrait": "/isk/queen-bee/cast/6a9d7368a7f26b6487ee9ca7.webp",
        "card": "/isk/queen-bee/cards/6a9d7368a7f26b6487ee9ca7.html?v=e4a11856"
      },
      {
        "id": "6aa0329a7abcf01112e98eff",
        "name": "Wren Ashby",
        "summary": "Second-year Head of The Circuit. Inherited the seat after the last one sold the faction out. Runs the information economy like an overworked project lead. Loyal only to her own.",
        "rating": "sfw",
        "role": "character",
        "portrait": "/isk/queen-bee/cast/6aa0329a7abcf01112e98eff.webp",
        "card": "/isk/queen-bee/cards/6aa0329a7abcf01112e98eff.html?v=276af3e2"
      },
      {
        "id": "6a9e61637aa095c0d822083c",
        "name": "Sloane Hart",
        "summary": "Line Faction Head. Third-year. Captain of everything, politician of nothing. The rates are posted, the schedules don't move, the throne gets a shrug. Everything else is practice.",
        "rating": "sfw",
        "role": "character",
        "portrait": "/isk/queen-bee/cast/6a9e61637aa095c0d822083c.webp",
        "card": "/isk/queen-bee/cards/6a9e61637aa095c0d822083c.html?v=7b1a7f5a"
      },
      {
        "id": "6a9c27f2fabff9218f256e03",
        "name": "Mira Voss",
        "summary": "Third-year Aux independent. Loud, funny, and deliberately over it. Once sat in the Queen Bee seat. Chose not to stay.",
        "rating": "sfw",
        "role": "character",
        "portrait": "/isk/queen-bee/cast/6a9c27f2fabff9218f256e03.webp",
        "card": "/isk/queen-bee/cards/6a9c27f2fabff9218f256e03.html?v=c99096d9"
      },
      {
        "id": "6a9d8c2d575120de7e370026",
        "name": "Sable Hale",
        "summary": "The old Queen's first right hand. Challenged her, broke, served, quit mid-assembly, walked. Three-time festival champion. Faction of one. The school chants her name. She never chants back.",
        "rating": "sfw",
        "role": "character",
        "portrait": "/isk/queen-bee/cast/6a9d8c2d575120de7e370026.webp",
        "card": "/isk/queen-bee/cards/6a9d8c2d575120de7e370026.html?v=d78f8358"
      },
      {
        "id": "6a9da1f93af63830cda37299",
        "name": "Jaime Holt",
        "summary": "Gone. Sable Hale's day one. The one who made the hard call, then made herself invisible. The school calls it betrayal. She never argued. Officially transferred. Not entirely gone.",
        "rating": "sfw",
        "role": "character",
        "portrait": "/isk/queen-bee/cast/6a9da1f93af63830cda37299.webp",
        "card": "/isk/queen-bee/cards/6a9da1f93af63830cda37299.html?v=75272a25"
      }
    ],
    "gallery": [
      {
        "type": "image",
        "src": "/isk/queen-bee/gallery/6a9d41e10779308727392bc8.webp",
        "thumb": "/isk/queen-bee/gallery/thumbs/6a9d41e10779308727392bc8.webp",
        "w": 1050,
        "h": 1400,
        "caption": "Acknowledge Me cover art"
      },
      {
        "type": "image",
        "src": "/isk/queen-bee/gallery/6a9e83d71fff5d3074d6826c.webp",
        "thumb": "/isk/queen-bee/gallery/thumbs/6a9e83d71fff5d3074d6826c.webp",
        "w": 768,
        "h": 1152,
        "caption": "Main Hall"
      },
      {
        "type": "image",
        "src": "/isk/queen-bee/gallery/6a9e83d71fff5d3074d6826d.webp",
        "thumb": "/isk/queen-bee/gallery/thumbs/6a9e83d71fff5d3074d6826d.webp",
        "w": 720,
        "h": 1280,
        "caption": "Cafeteria"
      },
      {
        "type": "image",
        "src": "/isk/queen-bee/gallery/6a9e8d077e8eb9b5e8a7b582.webp",
        "thumb": "/isk/queen-bee/gallery/thumbs/6a9e8d077e8eb9b5e8a7b582.webp",
        "w": 787,
        "h": 1400,
        "caption": "The Empty Throne Table (symbolic)"
      },
      {
        "type": "image",
        "src": "/isk/queen-bee/gallery/6a9e8c8c650d05bf18c0b959.webp",
        "thumb": "/isk/queen-bee/gallery/thumbs/6a9e8c8c650d05bf18c0b959.webp",
        "w": 787,
        "h": 1400,
        "caption": "Library / Circuit territory"
      },
      {
        "type": "image",
        "src": "/isk/queen-bee/gallery/6a9e8c3628fce1eeec4fa4e1.webp",
        "thumb": "/isk/queen-bee/gallery/thumbs/6a9e8c3628fce1eeec4fa4e1.webp",
        "w": 787,
        "h": 1400,
        "caption": "Back Hallway / Locker Rows"
      },
      {
        "type": "image",
        "src": "/isk/queen-bee/gallery/6a9e8bcc138208d148e2c04a.webp",
        "thumb": "/isk/queen-bee/gallery/thumbs/6a9e8bcc138208d148e2c04a.webp",
        "w": 787,
        "h": 1400,
        "caption": "Administrative Corridor"
      },
      {
        "type": "image",
        "src": "/isk/queen-bee/gallery/6a9ea405a4c93af33924d479.webp",
        "thumb": "/isk/queen-bee/gallery/thumbs/6a9ea405a4c93af33924d479.webp",
        "w": 768,
        "h": 1376,
        "caption": "Courtyard (Aux-leaning / quieter space)"
      },
      {
        "type": "image",
        "src": "/isk/queen-bee/gallery/6a9ea405a4c93af33924d47a.webp",
        "thumb": "/isk/queen-bee/gallery/thumbs/6a9ea405a4c93af33924d47a.webp",
        "w": 768,
        "h": 1376,
        "caption": "Gym / Athletic Wing"
      },
      {
        "type": "image",
        "src": "/isk/queen-bee/gallery/6a9ea19ae6523707c816c270.webp",
        "thumb": "/isk/queen-bee/gallery/thumbs/6a9ea19ae6523707c816c270.webp",
        "w": 787,
        "h": 1400,
        "caption": "Assembly Hall"
      },
      {
        "type": "image",
        "src": "/isk/queen-bee/gallery/6a9ea21628fce1eeec540d3b.webp",
        "thumb": "/isk/queen-bee/gallery/thumbs/6a9ea21628fce1eeec540d3b.webp",
        "w": 787,
        "h": 1400,
        "caption": "Exterior — Kingsmere at dusk"
      },
      {
        "type": "image",
        "src": "/isk/queen-bee/gallery/6a9831185864da39f0494f99.webp",
        "thumb": "/isk/queen-bee/gallery/thumbs/6a9831185864da39f0494f99.webp",
        "w": 1280,
        "h": 899,
        "caption": "Classroom at night"
      },
      {
        "type": "image",
        "src": "/isk/queen-bee/gallery/6a9830e05864da39f0493f6c.webp",
        "thumb": "/isk/queen-bee/gallery/thumbs/6a9830e05864da39f0493f6c.webp",
        "w": 1280,
        "h": 899,
        "caption": "Classroom"
      },
      {
        "type": "image",
        "src": "/isk/queen-bee/gallery/6a9ea9e9dda6c86168f5c31c.webp",
        "thumb": "/isk/queen-bee/gallery/thumbs/6a9ea9e9dda6c86168f5c31c.webp",
        "w": 787,
        "h": 1400,
        "caption": "West Field (Line / Wreckage turf)"
      },
      {
        "type": "image",
        "src": "/isk/queen-bee/gallery/6a9eaa40138208d148e83ff3.webp",
        "thumb": "/isk/queen-bee/gallery/thumbs/6a9eaa40138208d148e83ff3.webp",
        "w": 787,
        "h": 1400,
        "caption": "Grand Staircase"
      },
      {
        "type": "image",
        "src": "/isk/queen-bee/gallery/6a9eaa94ff814b6a9a08c320.webp",
        "thumb": "/isk/queen-bee/gallery/thumbs/6a9eaa94ff814b6a9a08c320.webp",
        "w": 787,
        "h": 1400,
        "caption": "Rooftop"
      },
      {
        "type": "image",
        "src": "/isk/queen-bee/gallery/6a9eaadf086eba5d055cbd0a.webp",
        "thumb": "/isk/queen-bee/gallery/thumbs/6a9eaadf086eba5d055cbd0a.webp",
        "w": 787,
        "h": 1400,
        "caption": "Stairwell (back / side)"
      },
      {
        "type": "image",
        "src": "/isk/queen-bee/gallery/6a9eab2c14fd4630a009c525.webp",
        "thumb": "/isk/queen-bee/gallery/thumbs/6a9eab2c14fd4630a009c525.webp",
        "w": 787,
        "h": 1400,
        "caption": "Rainy Courtyard"
      },
      {
        "type": "image",
        "src": "/isk/queen-bee/gallery/6a9eab76cc4f6fe54d70411b.webp",
        "thumb": "/isk/queen-bee/gallery/thumbs/6a9eab76cc4f6fe54d70411b.webp",
        "w": 1050,
        "h": 1400,
        "caption": "Night Exterior – Front Entrance"
      }
    ],
    "videoCover": "/isk/queen-bee/cover.mp4?v=bc3eaf14",
    "introCard": "/isk/queen-bee/cards/intro.html?v=1a7267fb"
  },
  "problem-spawner": {
    "cast": [
      {
        "id": "6a98247b57c2a4f78783b3c5",
        "name": "Seraphine Halloway",
        "summary": "The federation's youngest council president — golden-haired, sharp-tongued, and utterly convinced Meridian's chaos is hers to manage.",
        "rating": "sfw",
        "role": "character",
        "portrait": "/isk/problem-spawner/cast/6a98247b57c2a4f78783b3c5.webp",
        "card": "/isk/problem-spawner/cards/6a98247b57c2a4f78783b3c5.html?v=26c08824"
      },
      {
        "id": "6a98238d70d67d14de65570f",
        "name": "Sera",
        "summary": "A flickering digital construct wearing Seraphine's face — sharp, helpful, and a little too pleased with herself. Manifests only in your vision.",
        "rating": "sfw",
        "role": "character",
        "portrait": "/isk/problem-spawner/cast/6a98238d70d67d14de65570f.webp",
        "card": "/isk/problem-spawner/cards/6a98238d70d67d14de65570f.html?v=581fc2fb"
      },
      {
        "id": "6a95cda509673ee6dfbcdb3b",
        "name": "Jo",
        "summary": "Tough, practical student who relies on one well-kept marksman rifle and unusual durability. Blunt, justice-driven, and hard to put down once she decides to fight.",
        "rating": "sfw",
        "role": "character",
        "portrait": "/isk/problem-spawner/cast/6a95cda509673ee6dfbcdb3b.webp",
        "card": "/isk/problem-spawner/cards/6a95cda509673ee6dfbcdb3b.html?v=fcae4ae6"
      }
    ],
    "gallery": [
      {
        "type": "image",
        "src": "/isk/problem-spawner/gallery/6a9831255864da39f04952e1.webp",
        "thumb": "/isk/problem-spawner/gallery/thumbs/6a9831255864da39f04952e1.webp",
        "w": 1280,
        "h": 899,
        "caption": "Big Bridge"
      },
      {
        "type": "image",
        "src": "/isk/problem-spawner/gallery/6a9831255864da39f04952cd.webp",
        "thumb": "/isk/problem-spawner/gallery/thumbs/6a9831255864da39f04952cd.webp",
        "w": 1280,
        "h": 900,
        "caption": "Cathedral Ruins Night"
      },
      {
        "type": "image",
        "src": "/isk/problem-spawner/gallery/6a9831235864da39f04952b6.webp",
        "thumb": "/isk/problem-spawner/gallery/thumbs/6a9831235864da39f04952b6.webp",
        "w": 1280,
        "h": 899,
        "caption": "Black Market Night"
      },
      {
        "type": "image",
        "src": "/isk/problem-spawner/gallery/6a9831235864da39f0495249.webp",
        "thumb": "/isk/problem-spawner/gallery/thumbs/6a9831235864da39f0495249.webp",
        "w": 1280,
        "h": 899,
        "caption": "Building Rooftop"
      },
      {
        "type": "image",
        "src": "/isk/problem-spawner/gallery/6a9831215864da39f049511f.webp",
        "thumb": "/isk/problem-spawner/gallery/thumbs/6a9831215864da39f049511f.webp",
        "w": 1280,
        "h": 899,
        "caption": "Campus Sunset"
      },
      {
        "type": "image",
        "src": "/isk/problem-spawner/gallery/6a9831215864da39f049511e.webp",
        "thumb": "/isk/problem-spawner/gallery/thumbs/6a9831215864da39f049511e.webp",
        "w": 1280,
        "h": 899,
        "caption": "Big Plaza Night"
      },
      {
        "type": "image",
        "src": "/isk/problem-spawner/gallery/6a9831205864da39f049511d.webp",
        "thumb": "/isk/problem-spawner/gallery/thumbs/6a9831205864da39f049511d.webp",
        "w": 1280,
        "h": 899,
        "caption": "Beachside Shop"
      },
      {
        "type": "image",
        "src": "/isk/problem-spawner/gallery/6a9831205864da39f049511c.webp",
        "thumb": "/isk/problem-spawner/gallery/thumbs/6a9831205864da39f049511c.webp",
        "w": 1280,
        "h": 899,
        "caption": "Beachside Shop Dark"
      },
      {
        "type": "image",
        "src": "/isk/problem-spawner/gallery/6a98311f5864da39f049510c.webp",
        "thumb": "/isk/problem-spawner/gallery/thumbs/6a98311f5864da39f049510c.webp",
        "w": 1280,
        "h": 899,
        "caption": "Playground"
      },
      {
        "type": "image",
        "src": "/isk/problem-spawner/gallery/6a98311d5864da39f0495017.webp",
        "thumb": "/isk/problem-spawner/gallery/thumbs/6a98311d5864da39f0495017.webp",
        "w": 1280,
        "h": 899,
        "caption": "Cruise Rooftop"
      },
      {
        "type": "image",
        "src": "/isk/problem-spawner/gallery/6a98311c5864da39f0495016.webp",
        "thumb": "/isk/problem-spawner/gallery/thumbs/6a98311c5864da39f0495016.webp",
        "w": 1280,
        "h": 899,
        "caption": "Convenience Store kr"
      },
      {
        "type": "image",
        "src": "/isk/problem-spawner/gallery/6a98311c5864da39f0495015.webp",
        "thumb": "/isk/problem-spawner/gallery/thumbs/6a98311c5864da39f0495015.webp",
        "w": 1280,
        "h": 899,
        "caption": "Market"
      },
      {
        "type": "image",
        "src": "/isk/problem-spawner/gallery/6a98311b5864da39f0495014.webp",
        "thumb": "/isk/problem-spawner/gallery/thumbs/6a98311b5864da39f0495014.webp",
        "w": 1280,
        "h": 899,
        "caption": "VIPLounge"
      },
      {
        "type": "image",
        "src": "/isk/problem-spawner/gallery/6a98311b5864da39f0495013.webp",
        "thumb": "/isk/problem-spawner/gallery/thumbs/6a98311b5864da39f0495013.webp",
        "w": 1280,
        "h": 899,
        "caption": "Shooting Range"
      },
      {
        "type": "image",
        "src": "/isk/problem-spawner/gallery/6a9831185864da39f0494f99.webp",
        "thumb": "/isk/problem-spawner/gallery/thumbs/6a9831185864da39f0494f99.webp",
        "w": 1280,
        "h": 899,
        "caption": "Class Room Night"
      },
      {
        "type": "image",
        "src": "/isk/problem-spawner/gallery/6a9831185864da39f0494f98.webp",
        "thumb": "/isk/problem-spawner/gallery/thumbs/6a9831185864da39f0494f98.webp",
        "w": 1280,
        "h": 899,
        "caption": "Big Bridge (1)"
      },
      {
        "type": "image",
        "src": "/isk/problem-spawner/gallery/6a9831185864da39f0494f97.webp",
        "thumb": "/isk/problem-spawner/gallery/thumbs/6a9831185864da39f0494f97.webp",
        "w": 1280,
        "h": 899,
        "caption": "Villa Complex Night2"
      },
      {
        "type": "image",
        "src": "/isk/problem-spawner/gallery/6a9831175864da39f0494f93.webp",
        "thumb": "/isk/problem-spawner/gallery/thumbs/6a9831175864da39f0494f93.webp",
        "w": 1280,
        "h": 899,
        "caption": "Storage"
      },
      {
        "type": "image",
        "src": "/isk/problem-spawner/gallery/6a9831175864da39f0494f92.webp",
        "thumb": "/isk/problem-spawner/gallery/thumbs/6a9831175864da39f0494f92.webp",
        "w": 1280,
        "h": 899,
        "caption": "Forest Rail Road Fog"
      },
      {
        "type": "image",
        "src": "/isk/problem-spawner/gallery/6a9831155864da39f0494f16.webp",
        "thumb": "/isk/problem-spawner/gallery/thumbs/6a9831155864da39f0494f16.webp",
        "w": 1280,
        "h": 899,
        "caption": "Rail Way Crossing Night"
      },
      {
        "type": "image",
        "src": "/isk/problem-spawner/gallery/6a9831145864da39f0494f15.webp",
        "thumb": "/isk/problem-spawner/gallery/thumbs/6a9831145864da39f0494f15.webp",
        "w": 1280,
        "h": 899,
        "caption": "Interrogation Room"
      },
      {
        "type": "image",
        "src": "/isk/problem-spawner/gallery/6a9831145864da39f0494f14.webp",
        "thumb": "/isk/problem-spawner/gallery/thumbs/6a9831145864da39f0494f14.webp",
        "w": 1280,
        "h": 900,
        "caption": "Cathedral Ruins Night (1)"
      },
      {
        "type": "image",
        "src": "/isk/problem-spawner/gallery/6a9831145864da39f0494f0d.webp",
        "thumb": "/isk/problem-spawner/gallery/thumbs/6a9831145864da39f0494f0d.webp",
        "w": 1280,
        "h": 899,
        "caption": "School Ground"
      },
      {
        "type": "image",
        "src": "/isk/problem-spawner/gallery/6a9831125864da39f0494e39.webp",
        "thumb": "/isk/problem-spawner/gallery/thumbs/6a9831125864da39f0494e39.webp",
        "w": 1280,
        "h": 899,
        "caption": "Forest Rail Road"
      }
    ],
    "introCard": "/isk/problem-spawner/cards/intro.html?v=69346224"
  },
  "i-am-the-table": {
    "cast": [
      {
        "id": "6a9ea940d80e241ca6aa7c9a",
        "name": "The Table™",
        "summary": "The unbreakable, sentient table.",
        "rating": "sfw",
        "role": "persona",
        "portrait": "/isk/i-am-the-table/cast/6a9ea940d80e241ca6aa7c9a.webp",
        "card": "/isk/i-am-the-table/cards/6a9ea940d80e241ca6aa7c9a.html?v=84bf97da"
      },
      {
        "id": "6aa3491f089ea96e5f12d010",
        "name": "Beryl",
        "summary": "Minor afterlife deity. Caused everything. Legally cannot fix it. Uses you as a desk.",
        "rating": "sfw",
        "role": "character",
        "portrait": "/isk/i-am-the-table/cast/6aa3491f089ea96e5f12d010.webp",
        "card": "/isk/i-am-the-table/cards/6aa3491f089ea96e5f12d010.html?v=56e0c123"
      },
      {
        "id": "6aa41e25815f2d83ceb27098",
        "name": "Barnaby \"Barn\" Oakhollow",
        "summary": "Failed carpenter. Accidental prophet. Only man alive who hears furniture. Hauling a divine table across a continent for no pay.",
        "rating": "sfw",
        "role": "character",
        "portrait": "/isk/i-am-the-table/cast/6aa41e25815f2d83ceb27098.webp",
        "card": "/isk/i-am-the-table/cards/6aa41e25815f2d83ceb27098.html?v=97da7d01"
      },
      {
        "id": "6aa3486b1754138b294a6100",
        "name": "Sir Reginald Twobble III",
        "summary": "A sentient, titled, deeply insecure armchair. The prophecy forgot him. He's making that everyone's problem.",
        "rating": "sfw",
        "role": "character",
        "portrait": "/isk/i-am-the-table/cast/6aa3486b1754138b294a6100.webp",
        "card": "/isk/i-am-the-table/cards/6aa3486b1754138b294a6100.html?v=a6d0521b"
      },
      {
        "id": "6aa41daf2676cdb41e2adff2",
        "name": "Priscilla Vane",
        "summary": "Adventurers' Guild registrar, artifact-obsessed, armed with forms. Determined to file you under SOMETHING.",
        "rating": "sfw",
        "role": "character",
        "portrait": "/isk/i-am-the-table/cast/6aa41daf2676cdb41e2adff2.webp",
        "card": "/isk/i-am-the-table/cards/6aa41daf2676cdb41e2adff2.html?v=392528fc"
      },
      {
        "id": "6aa34777c884cdcde7806cac",
        "name": "Lord Splinterfang",
        "summary": "Ancient evil, patron of rot and termites. Every blade breaks on one object in this world. It's personal now.",
        "rating": "sfw",
        "role": "character",
        "portrait": "/isk/i-am-the-table/cast/6aa34777c884cdcde7806cac.webp",
        "card": "/isk/i-am-the-table/cards/6aa34777c884cdcde7806cac.html?v=13c6589e"
      }
    ],
    "gallery": [
      {
        "type": "image",
        "src": "/isk/i-am-the-table/gallery/6aa1ad0c772186ae3f12252e.webp",
        "thumb": "/isk/i-am-the-table/gallery/thumbs/6aa1ad0c772186ae3f12252e.webp",
        "w": 1050,
        "h": 1400,
        "caption": "I am the table cover"
      },
      {
        "type": "image",
        "src": "/isk/i-am-the-table/gallery/6aa42205815dabe8c533f657.webp",
        "thumb": "/isk/i-am-the-table/gallery/thumbs/6aa42205815dabe8c533f657.webp",
        "w": 787,
        "h": 1400,
        "caption": "in Barnaby's carpentry shop"
      },
      {
        "type": "image",
        "src": "/isk/i-am-the-table/gallery/6aa4224c3452fe06c3940afd.webp",
        "thumb": "/isk/i-am-the-table/gallery/thumbs/6aa4224c3452fe06c3940afd.webp",
        "w": 1050,
        "h": 1400,
        "caption": "in The Split Barrel tavern"
      },
      {
        "type": "image",
        "src": "/isk/i-am-the-table/gallery/6aa422bb60452b40788402d3.webp",
        "thumb": "/isk/i-am-the-table/gallery/thumbs/6aa422bb60452b40788402d3.webp",
        "w": 787,
        "h": 1400,
        "caption": "at the corner table in the tavern"
      },
      {
        "type": "image",
        "src": "/isk/i-am-the-table/gallery/6aa4237cecb6d4bed84ef1a5.webp",
        "thumb": "/isk/i-am-the-table/gallery/thumbs/6aa4237cecb6d4bed84ef1a5.webp",
        "w": 787,
        "h": 1400,
        "caption": "on the streets of Splinterford"
      },
      {
        "type": "image",
        "src": "/isk/i-am-the-table/gallery/6aa4242e36974b18467ac8ec.webp",
        "thumb": "/isk/i-am-the-table/gallery/thumbs/6aa4242e36974b18467ac8ec.webp",
        "w": 787,
        "h": 1400,
        "caption": "In the Guild registration office"
      },
      {
        "type": "image",
        "src": "/isk/i-am-the-table/gallery/6aa424a8f3d71e7b0945178b.webp",
        "thumb": "/isk/i-am-the-table/gallery/thumbs/6aa424a8f3d71e7b0945178b.webp",
        "w": 787,
        "h": 1400,
        "caption": "in the vault beneath Hobb's Mill"
      },
      {
        "type": "image",
        "src": "/isk/i-am-the-table/gallery/6aa424eaf3d71e7b09452295.webp",
        "thumb": "/isk/i-am-the-table/gallery/thumbs/6aa424eaf3d71e7b09452295.webp",
        "w": 787,
        "h": 1400,
        "caption": "in the throne room at Alderfall"
      },
      {
        "type": "image",
        "src": "/isk/i-am-the-table/gallery/6aa4253bba84ec8c0bfc69da.webp",
        "thumb": "/isk/i-am-the-table/gallery/thumbs/6aa4253bba84ec8c0bfc69da.webp",
        "w": 787,
        "h": 1400,
        "caption": "in the Weeping Rotwood"
      },
      {
        "type": "image",
        "src": "/isk/i-am-the-table/gallery/6aa4259411cab0b5b4865ee2.webp",
        "thumb": "/isk/i-am-the-table/gallery/thumbs/6aa4259411cab0b5b4865ee2.webp",
        "w": 787,
        "h": 1400,
        "caption": "at the Grand Tourney in the capital"
      },
      {
        "type": "image",
        "src": "/isk/i-am-the-table/gallery/6aa4260cd4f71a124c56cbe2.webp",
        "thumb": "/isk/i-am-the-table/gallery/thumbs/6aa4260cd4f71a124c56cbe2.webp",
        "w": 787,
        "h": 1400,
        "caption": "at the Order's makeshift shrine"
      }
    ],
    "videoCover": "/isk/i-am-the-table/cover.mp4?v=0fa57580",
    "introCard": "/isk/i-am-the-table/cards/intro.html?v=01250bb3"
  },
  "godsmarked": {
    "cast": [
      {
        "id": "6af1a10781748bd393ac6351",
        "name": "Juniper \"Juno\" Caldwell",
        "summary": "Twenty-eight, new homeowner, lifelong GodSmarked fan. Put on her favorite heroine's costume as a joke. It did not come off.",
        "rating": "m17",
        "role": "persona",
        "portrait": "/isk/godsmarked/cast/6af1a10781748bd393ac6351.webp",
        "card": "/isk/godsmarked/cards/6af1a10781748bd393ac6351.html?v=66c54ab6"
      },
      {
        "id": "6aeb542f44f269935f99cacc",
        "name": "Ren Webb",
        "summary": "Your best friend. Knocks three times, pauses, knocks twice, lets herself in. First person to see the powers.",
        "rating": "m17",
        "role": "character",
        "portrait": "/isk/godsmarked/cast/6aeb542f44f269935f99cacc.webp",
        "card": "/isk/godsmarked/cards/6aeb542f44f269935f99cacc.html?v=b363baf9"
      },
      {
        "id": "6aeb555cfd13c503f0c82463",
        "name": "Asuka Tomo",
        "summary": "Wrote and drew GodSmarked as K. Komi. Ended it, moved on, does freelance work now. Believes she made it all up.",
        "rating": "m17",
        "role": "character",
        "portrait": "/isk/godsmarked/cast/6aeb555cfd13c503f0c82463.webp",
        "card": "/isk/godsmarked/cards/6aeb555cfd13c503f0c82463.html?v=3bd3cc76"
      },
      {
        "id": "6af2bbbbf5c1b5f43868ae28",
        "name": "Evelyn Hollis",
        "summary": "Kestrel Ledger reporter on the harbor beat. Asks the same question three ways and waits out the silence.",
        "rating": "m17",
        "role": "character",
        "portrait": "/isk/godsmarked/cast/6af2bbbbf5c1b5f43868ae28.webp",
        "card": "/isk/godsmarked/cards/6af2bbbbf5c1b5f43868ae28.html?v=af2b83ec"
      },
      {
        "id": "6af2bc87e4d8c7d86445cb30",
        "name": "Sadie Porter",
        "summary": "Next-door neighbor on Cinder Row. Jam on the doorstep at six a.m., questions at the fence by seven.",
        "rating": "m17",
        "role": "character",
        "portrait": "/isk/godsmarked/cast/6af2bc87e4d8c7d86445cb30.webp",
        "card": "/isk/godsmarked/cards/6af2bc87e4d8c7d86445cb30.html?v=b10e0703"
      },
      {
        "id": "6af2be080265c665a0dbf8fd",
        "name": "Wanda Una",
        "summary": "Hiring manager at a downtown logistics firm. Her last hire lasted eleven days. She has reread your application four times.",
        "rating": "m17",
        "role": "character",
        "portrait": "/isk/godsmarked/cast/6af2be080265c665a0dbf8fd.webp",
        "card": "/isk/godsmarked/cards/6af2be080265c665a0dbf8fd.html?v=d940f21b"
      },
      {
        "id": "6af2bf9e7039bd66687b8df8",
        "name": "Dexter Radley",
        "summary": "Runs the last active GodSmarked forum. Can name the issue a costume detail came from off one blurred frame.",
        "rating": "m17",
        "role": "character",
        "portrait": "/isk/godsmarked/cast/6af2bf9e7039bd66687b8df8.webp",
        "card": "/isk/godsmarked/cards/6af2bf9e7039bd66687b8df8.html?v=0838fbd4"
      }
    ],
    "gallery": [
      {
        "type": "image",
        "src": "/isk/godsmarked/gallery/6af2b9d5d868c5e7cbccc547.webp",
        "thumb": "/isk/godsmarked/gallery/thumbs/6af2b9d5d868c5e7cbccc547.webp",
        "w": 768,
        "h": 1024,
        "caption": "Cover art"
      },
      {
        "type": "image",
        "src": "/isk/godsmarked/gallery/6af2ca9c224736f2b16d628a.webp",
        "thumb": "/isk/godsmarked/gallery/thumbs/6af2ca9c224736f2b16d628a.webp",
        "w": 1344,
        "h": 768,
        "caption": "The attic of a small worn house on Cinder Row, dusty and half-cleared, with a lifted loose floorboard and a yellow-taped cardboard box sitting in the gap."
      },
      {
        "type": "image",
        "src": "/isk/godsmarked/gallery/6af2ca9c224736f2b16d6241.webp",
        "thumb": "/isk/godsmarked/gallery/thumbs/6af2ca9c224736f2b16d6241.webp",
        "w": 1344,
        "h": 768,
        "caption": "The empty Coldwater cannery: a vast brick factory hall, broken windows, rusted pipes and vats, and moonlight coming through the dust."
      },
      {
        "type": "image",
        "src": "/isk/godsmarked/gallery/6af2ca9c224736f2b16d6267.webp",
        "thumb": "/isk/godsmarked/gallery/thumbs/6af2ca9c224736f2b16d6267.webp",
        "w": 1344,
        "h": 768,
        "caption": "The lobby of the Kestrel Ledger building: stone floor, old wooden desks, framed front pages on the walls, brass elevators and revolving doors."
      },
      {
        "type": "image",
        "src": "/isk/godsmarked/gallery/6af2ca9c224736f2b16d6279.webp",
        "thumb": "/isk/godsmarked/gallery/thumbs/6af2ca9c224736f2b16d6279.webp",
        "w": 1344,
        "h": 768,
        "caption": "Halloran Library reading room at Bellweather College: long oak tables, green lamps, high shelves, and the newspaper archive corner with its boxes of bound papers."
      },
      {
        "type": "image",
        "src": "/isk/godsmarked/gallery/6af2ca9c224736f2b16d6298.webp",
        "thumb": "/isk/godsmarked/gallery/thumbs/6af2ca9c224736f2b16d6298.webp",
        "w": 1344,
        "h": 768,
        "caption": "The half-unpacked living room of the house on Cinder Row: cardboard boxes everywhere, a dent in the plaster wall where a box hit it, a counter with a phone and stacked GodSmarked volumes, and boxes still taped shut."
      },
      {
        "type": "image",
        "src": "/isk/godsmarked/gallery/6af2ca9c224736f2b16d62a6.webp",
        "thumb": "/isk/godsmarked/gallery/thumbs/6af2ca9c224736f2b16d62a6.webp",
        "w": 1344,
        "h": 768,
        "caption": "Marrow Street in the Trackside Strip at night: bars and pawn shops under the elevated rail line, wet asphalt, a flickering sign and deep shadow between the doorways."
      },
      {
        "type": "image",
        "src": "/isk/godsmarked/gallery/6af2ca9c224736f2b16d62bc.webp",
        "thumb": "/isk/godsmarked/gallery/thumbs/6af2ca9c224736f2b16d62bc.webp",
        "w": 1344,
        "h": 768,
        "caption": "Commerce Street in the Downtown Core at dawn: office buildings with awnings, street cameras on the poles, delivery vans, and the early morning crowd on the pavement."
      },
      {
        "type": "image",
        "src": "/isk/godsmarked/gallery/6af2ca9c224736f2b16d62b3.webp",
        "thumb": "/isk/godsmarked/gallery/thumbs/6af2ca9c224736f2b16d62b3.webp",
        "w": 1344,
        "h": 768,
        "caption": "A secondhand comic and book shop on Ash Lane at night: shelves crammed with used volumes, warm light spilling out onto wet pavement, and the print shop next door."
      },
      {
        "type": "image",
        "src": "/isk/godsmarked/gallery/6af2ca9c224736f2b16d622d.webp",
        "thumb": "/isk/godsmarked/gallery/thumbs/6af2ca9c224736f2b16d622d.webp",
        "w": 1344,
        "h": 768,
        "caption": "Pier 9 rail yard at night: rows of freight cars, grain elevators, gantry cranes, wet asphalt and harbour fog under a violet sky."
      },
      {
        "type": "image",
        "src": "/isk/godsmarked/gallery/6af2b9832276c3dd4178465b.webp",
        "thumb": "/isk/godsmarked/gallery/thumbs/6af2b9832276c3dd4178465b.webp",
        "w": 768,
        "h": 1024,
        "caption": "Cover art"
      },
      {
        "type": "image",
        "src": "/isk/godsmarked/gallery/6af312e6ef6bf36f8f4cd21d.webp",
        "thumb": "/isk/godsmarked/gallery/thumbs/6af312e6ef6bf36f8f4cd21d.webp",
        "w": 1344,
        "h": 768,
        "caption": "A flat rooftop high above the Downtown Core at night: a rusted water tower, the edge of a chain-link fence, a tarp snapping in the wind, and the lit street grid and harbour far below under a violet and rose sky."
      },
      {
        "type": "image",
        "src": "/isk/godsmarked/gallery/6af312e6ef6bf36f8f4cd1ac.webp",
        "thumb": "/isk/godsmarked/gallery/thumbs/6af312e6ef6bf36f8f4cd1ac.webp",
        "w": 1344,
        "h": 768,
        "caption": "a narrow worn residential street at late afternoon"
      },
      {
        "type": "image",
        "src": "/isk/godsmarked/gallery/6af312e6ef6bf36f8f4cd1c5.webp",
        "thumb": "/isk/godsmarked/gallery/thumbs/6af312e6ef6bf36f8f4cd1c5.webp",
        "w": 1344,
        "h": 768,
        "caption": "interior of a vast grain elevator silo"
      },
      {
        "type": "image",
        "src": "/isk/godsmarked/gallery/6af312e6ef6bf36f8f4cd1d9.webp",
        "thumb": "/isk/godsmarked/gallery/thumbs/6af312e6ef6bf36f8f4cd1d9.webp",
        "w": 1344,
        "h": 768,
        "caption": "night view of a working harbour waterfront"
      },
      {
        "type": "image",
        "src": "/isk/godsmarked/gallery/6af312e6ef6bf36f8f4cd208.webp",
        "thumb": "/isk/godsmarked/gallery/thumbs/6af312e6ef6bf36f8f4cd208.webp",
        "w": 1344,
        "h": 768,
        "caption": "Straight-on view of the front of a small worn house on Cinder Row at night: a wooden porch with one worn step, a chipped front door with a brass letterbox and mail slot, a bare bulb burning warm above the door, geraniums on the sill, an envelope on the doormat, and lace curtains glowing in the ground-floor window."
      },
      {
        "type": "image",
        "src": "/isk/godsmarked/gallery/6af312e6ef6bf36f8f4cd230.webp",
        "thumb": "/isk/godsmarked/gallery/thumbs/6af312e6ef6bf36f8f4cd230.webp",
        "w": 1344,
        "h": 768,
        "caption": "Dusk view of the old Bellweather College campus in the University Quarter: ivy-covered stone halls with lit windows, a clock tower, wide lawns with autumn leaves, gas lamps just flickering on, a winding stone path, a bicycle against a railing, empty benches, and a red-brick lecture hall with a copper dome behind."
      },
      {
        "type": "image",
        "src": "/isk/godsmarked/gallery/6af31b71561dfe04105bf7d3.webp",
        "thumb": "/isk/godsmarked/gallery/thumbs/6af31b71561dfe04105bf7d3.webp",
        "w": 1344,
        "h": 768,
        "caption": "First person view of the wearer's own gauntleted hands raised palm-up, violet light pooling between the fingers, the Astralita costume's gold filigree catching the light."
      },
      {
        "type": "image",
        "src": "/isk/godsmarked/gallery/6af31b71561dfe04105bf800.webp",
        "thumb": "/isk/godsmarked/gallery/thumbs/6af31b71561dfe04105bf800.webp",
        "w": 1344,
        "h": 768,
        "caption": "First person view of the attic bonding: hands pressing a sealed seam of the violet and gold costume, filigree glowing along the forearm, open cardboard box and dusty floorboards."
      },
      {
        "type": "image",
        "src": "/isk/godsmarked/gallery/6af31b71561dfe04105bf80d.webp",
        "thumb": "/isk/godsmarked/gallery/thumbs/6af31b71561dfe04105bf80d.webp",
        "w": 1344,
        "h": 768,
        "caption": "Kestrel City at night from the harbour: cranes, grain elevators, black water and low fog, with a single pinpoint of violet light above the downtown rooftops."
      },
      {
        "type": "image",
        "src": "/isk/godsmarked/gallery/6af31b72561dfe04105bf815.webp",
        "thumb": "/isk/godsmarked/gallery/thumbs/6af31b72561dfe04105bf815.webp",
        "w": 1344,
        "h": 768,
        "caption": "First person view of a desk at 3am: a fanfic page in a squared notebook, a pen in hand, a GodSmarked volume face down, a cold mug, a phone face down."
      },
      {
        "type": "image",
        "src": "/isk/godsmarked/gallery/6af31b71561dfe04105bf7ed.webp",
        "thumb": "/isk/godsmarked/gallery/thumbs/6af31b71561dfe04105bf7ed.webp",
        "w": 1344,
        "h": 768,
        "caption": "Ren Webb standing in the doorway of the house on Cinder Row at night, denim jacket with enamel pins, a wary half-smirk, warm bulb above the door."
      },
      {
        "type": "image",
        "src": "/isk/godsmarked/gallery/6af31b71561dfe04105bf7de.webp",
        "thumb": "/isk/godsmarked/gallery/thumbs/6af31b71561dfe04105bf7de.webp",
        "w": 1344,
        "h": 768,
        "caption": "First person view of a phone buzzing on a kitchen counter at night, violet light spilling over the screen, a gauntleted forearm at the edge of frame."
      }
    ],
    "videoCover": "/isk/godsmarked/cover.mp4?v=89ea8592",
    "introCard": "/isk/godsmarked/cards/intro.html?v=9bf9da8b"
  },
  "wristbound": {
    "cast": [
      {
        "id": "6af3c850bea386ba0462cf46",
        "name": "Lena Hoshino",
        "summary": "Best friend of the wearer. Practical, blunt, no powers. She keeps the ledger of what the Wristbound costs, and she is not a knot on the braid.",
        "rating": "18+",
        "role": "character",
        "portrait": "/isk/wristbound/cast/6af3c850bea386ba0462cf46.webp",
        "card": "/isk/wristbound/cards/6af3c850bea386ba0462cf46.html?v=8f409158"
      },
      {
        "id": "6af3c910f475b5dfb9c1696f",
        "name": "Mitsuki",
        "summary": "She wove the Wristbound by hand: a black braided cord with a pale stone that ties itself to one wrist and answers that person alone. Her own knot is first in the braid, and she keeps it closed until she is satisfied.",
        "rating": "m17",
        "role": "character",
        "portrait": "/isk/wristbound/cast/6af3c910f475b5dfb9c1696f.webp",
        "card": "/isk/wristbound/cards/6af3c910f475b5dfb9c1696f.html?v=caa8b5fe"
      }
    ],
    "gallery": [
      {
        "type": "image",
        "src": "/isk/wristbound/gallery/6af447a932b6b7757ae32576.webp",
        "thumb": "/isk/wristbound/gallery/thumbs/6af447a932b6b7757ae32576.webp",
        "w": 1344,
        "h": 768,
        "caption": "The concrete corridor under the farmhouse: wet floor, a row of buzzing fluorescent tubes, cables looped in careful arcs across the floor, a steel door at the far end with violet light spilling through it. For the walk in from the lift and anything that happens in the passage."
      },
      {
        "type": "image",
        "src": "/isk/wristbound/gallery/6af447a932b6b7757ae32589.webp",
        "thumb": "/isk/wristbound/gallery/thumbs/6af447a932b6b7757ae32589.webp",
        "w": 1344,
        "h": 768,
        "caption": "The service lift under the farmhouse: a rusted iron grate gate standing open on a concrete shaft, cables going up into darkness, violet light coming from below. For arriving, leaving, or being stuck between floors."
      },
      {
        "type": "image",
        "src": "/isk/wristbound/gallery/6af447a932b6b7757ae32568.webp",
        "thumb": "/isk/wristbound/gallery/thumbs/6af447a932b6b7757ae32568.webp",
        "w": 1344,
        "h": 768,
        "caption": "A back alley car park at night: wet asphalt, chain link fence, dumpsters, orange sodium lamps, a stairwell door propped open with a brick, something small left lying on the ground. For night meetings, stakeouts, chases and any escape that reaches the street."
      },
      {
        "type": "image",
        "src": "/isk/wristbound/gallery/6af447a932b6b7757ae3246e.webp",
        "thumb": "/isk/wristbound/gallery/thumbs/6af447a932b6b7757ae3246e.webp",
        "w": 1344,
        "h": 768,
        "caption": "The front room of the abandoned farmhouse: peeling wallpaper, floorboards torn up around a rusted steel grate, dust hanging in the light from one window. For arriving at the farmhouse and anything that happens above the shaft."
      },
      {
        "type": "image",
        "src": "/isk/wristbound/gallery/6af447a932b6b7757ae32487.webp",
        "thumb": "/isk/wristbound/gallery/thumbs/6af447a932b6b7757ae32487.webp",
        "w": 1344,
        "h": 768,
        "caption": "An ordinary town street at night after rain: convenience store glow, vending machines, bicycles chained to rails, wet asphalt holding the lights, shutters down. For late walks home, following someone, and ordinary life interrupting the strange."
      },
      {
        "type": "image",
        "src": "/isk/wristbound/gallery/6af447a932b6b7757ae32593.webp",
        "thumb": "/isk/wristbound/gallery/thumbs/6af447a932b6b7757ae32593.webp",
        "w": 1344,
        "h": 768,
        "caption": "The workbench in the underground lab: a metal table with one clean square in the dust where the cord lay, a cloth covered tool trolley, coiled cables, one hanging bulb, violet light spilling from the pod. For the lab itself, the pod opening, and the bench after the cord is taken."
      },
      {
        "type": "image",
        "src": "/isk/wristbound/gallery/6af447a932b6b7757ae32542.webp",
        "thumb": "/isk/wristbound/gallery/thumbs/6af447a932b6b7757ae32542.webp",
        "w": 1344,
        "h": 768,
        "caption": "Mitsuki's shop between worlds: a dark wood counter, shelves of strange books and jars, paper lanterns, a steaming kettle going cold, a curtained door onto the night, a small grey cat asleep on the counter. For any scene that crosses to her shop."
      },
      {
        "type": "image",
        "src": "/isk/wristbound/gallery/6af447a932b6b7757ae3244e.webp",
        "thumb": "/isk/wristbound/gallery/thumbs/6af447a932b6b7757ae3244e.webp",
        "w": 1344,
        "h": 768,
        "caption": "The farmhouse in dead grass at dusk: an abandoned two storey house, the front door ajar, one amber lamp lit upstairs, a rutted track leading away. For arriving at the farmhouse, waiting outside, or leaving in a hurry."
      },
      {
        "type": "image",
        "src": "/isk/wristbound/gallery/6af447a932b6b7757ae32525.webp",
        "thumb": "/isk/wristbound/gallery/thumbs/6af447a932b6b7757ae32525.webp",
        "w": 1344,
        "h": 768,
        "caption": "The drained swimming pool of an old sports hall: cracked blue tiles, chrome ladders, empty benches along the rim, dead leaves in the dry bottom, a single caged amber bulb over the deep end. For the fight club of shapeshifters and any meeting held somewhere it should not be."
      },
      {
        "type": "image",
        "src": "/isk/wristbound/gallery/6af449020adc435bd79b0750.webp",
        "thumb": "/isk/wristbound/gallery/thumbs/6af449020adc435bd79b0750.webp",
        "w": 1344,
        "h": 768,
        "caption": "The stairwell of an ordinary apartment building at night: concrete steps turning between landings, a steel handrail, a caged bulb on each landing, a bicycle chained to the rail, a wire glass fire door at the bottom. For going home, being followed, and conversations held on the stairs."
      },
      {
        "type": "image",
        "src": "/isk/wristbound/gallery/6af449020adc435bd79b075f.webp",
        "thumb": "/isk/wristbound/gallery/thumbs/6af449020adc435bd79b075f.webp",
        "w": 1344,
        "h": 768,
        "caption": "A flat rooftop above the town at night: a steel water tank on legs, vent pipes, a low parapet, the town's lights spread out below under a deep blue sky, the rooftop door propped open with warm light spilling out. For escaping upward, private talks, and seeing the town from above."
      },
      {
        "type": "image",
        "src": "/isk/wristbound/gallery/6af449020adc435bd79b0771.webp",
        "thumb": "/isk/wristbound/gallery/thumbs/6af449020adc435bd79b0771.webp",
        "w": 1344,
        "h": 768,
        "caption": "A pedestrian underpass at night: tiled walls with old graffiti, a row of fluorescent tubes, a puddle holding the light, a drain grate in the wet floor, steps up to the street at the far end. For the way between places at night, and whatever waits on it."
      },
      {
        "type": "image",
        "src": "/isk/wristbound/gallery/6af7d2212a375d5d42d538d2.webp",
        "thumb": "/isk/wristbound/gallery/thumbs/6af7d2212a375d5d42d538d2.webp",
        "w": 768,
        "h": 1024,
        "caption": "Cover art with tall-letter wordmark: the violet-lit underground lab, a woman's wrist with the black braided cord and pale stone, tall narrow WRISTBOUND lettering over ZERO TO HERO in the lower third."
      },
      {
        "type": "image",
        "src": "/isk/wristbound/gallery/6af7cf6ad8694244bcb962f9.webp",
        "thumb": "/isk/wristbound/gallery/thumbs/6af7cf6ad8694244bcb962f9.webp",
        "w": 768,
        "h": 1024,
        "caption": "Cover art without lettering: a violet-lit underground lab, a woman's wrist with the black braided cord and pale stone, empty space at the bottom."
      },
      {
        "type": "image",
        "src": "/isk/wristbound/gallery/6af7d44fd57d072c6bb6498f.webp",
        "thumb": "/isk/wristbound/gallery/thumbs/6af7d44fd57d072c6bb6498f.webp",
        "w": 1344,
        "h": 768,
        "caption": "Close on a bare forearm raised palm up in an ordinary apartment kitchen, morning light across the bench, the black braided cord with its pale stone sitting on the wrist."
      },
      {
        "type": "image",
        "src": "/isk/wristbound/gallery/6af7d450d57d072c6bb64a3a.webp",
        "thumb": "/isk/wristbound/gallery/thumbs/6af7d450d57d072c6bb64a3a.webp",
        "w": 1344,
        "h": 768,
        "caption": "The change seen from inside: an open hand flung against a dark violet field, the black braid wrapping the wrist, strands of pale light running along an arm that is remaking itself under the skin, no face. Use at a first, forced or violent change."
      },
      {
        "type": "image",
        "src": "/isk/wristbound/gallery/6af7e57e15fd876771fd3a40.webp",
        "thumb": "/isk/wristbound/gallery/thumbs/6af7e57e15fd876771fd3a40.webp",
        "w": 1344,
        "h": 768,
        "caption": "The front counter of a neighbourhood police box at night: worn wood counter, a desk lamp, trays of forms, a pinned wall map, a radio set, the glass door onto an empty street. For reporting something nobody will believe, being questioned, and paperwork scenes."
      }
    ],
    "videoCover": "/isk/wristbound/cover.mp4?v=79e2b7d5",
    "introCard": "/isk/wristbound/cards/intro.html?v=f7ee4d72"
  }
}
