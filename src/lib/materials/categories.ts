import { GatheringCategory } from './types';
import { mcData, normalizeName } from './recipes';

// Wood species prefixes in Minecraft
const WOOD_SPECIES = [
  'oak',
  'spruce',
  'birch',
  'jungle',
  'acacia',
  'dark_oak',
  'mangrove',
  'cherry',
  'bamboo'
];

/**
 * Deterministically classifies a Minecraft item or block into its natural
 * survival acquisition / gathering category based on Minecraft data and semantics.
 */
export function getGatheringCategory(itemName: string): GatheringCategory {
  const cleanName = normalizeName(itemName).toLowerCase().replace(/^craft_/, '');

  const block = mcData.blocksByName[cleanName];

  // 1. Block tag / material checks from Minecraft data
  if (block && block.material) {
    const mat = block.material;
    if (mat === 'wool' || mat === 'coweb') {
      return 'Mob/Organic';
    }
  }

  // 2. Nether dimension resources
  if (
    cleanName.includes('nether') ||
    cleanName.includes('quartz') ||
    cleanName.includes('soul_') ||
    cleanName.includes('magma') ||
    cleanName.includes('glowstone') ||
    cleanName.includes('blaze') ||
    cleanName.includes('ghast') ||
    cleanName.includes('wither') ||
    cleanName.includes('crimson') ||
    cleanName.includes('warped') ||
    cleanName.includes('blackstone') ||
    cleanName.includes('basalt') ||
    cleanName.includes('nylium') ||
    cleanName.includes('ancient_debris') ||
    cleanName.includes('netherite') ||
    cleanName.includes('shroomlight') ||
    cleanName.includes('crying_obsidian')
  ) {
    return 'Nether';
  }

  // 3. The End dimension resources
  if (
    cleanName.includes('end_') ||
    cleanName.includes('purpur') ||
    cleanName.includes('chorus') ||
    cleanName.includes('shulker') ||
    cleanName.includes('elytra') ||
    cleanName.includes('dragon') ||
    cleanName.includes('end_stone') ||
    cleanName.includes('end_rod')
  ) {
    return 'End';
  }

  // 4. Mob & Organic drops (Animals, Monsters, Biological products)
  if (
    cleanName.includes('wool') ||
    cleanName.includes('carpet') ||
    cleanName.includes('ink_sac') ||
    cleanName.includes('string') ||
    cleanName.includes('cobweb') ||
    cleanName.includes('spider') ||
    cleanName.includes('bone') ||
    cleanName.includes('flesh') ||
    cleanName.includes('gunpowder') ||
    cleanName.includes('leather') ||
    cleanName.includes('feather') ||
    cleanName.includes('egg') ||
    cleanName.includes('meat') ||
    cleanName.includes('beef') ||
    cleanName.includes('pork') ||
    cleanName.includes('chicken') ||
    cleanName.includes('mutton') ||
    cleanName.includes('rabbit') ||
    cleanName.includes('cod') ||
    cleanName.includes('salmon') ||
    cleanName.includes('slime') ||
    cleanName.includes('honey') ||
    cleanName.includes('comb') ||
    cleanName.includes('scute') ||
    cleanName.includes('nautilus') ||
    cleanName.includes('phantom') ||
    cleanName.includes('ender_pearl') ||
    cleanName.includes('eye_of_ender') ||
    cleanName.includes('sculk')
  ) {
    return 'Mob/Organic';
  }

  // 5. Farming, Botany, Crops & Dyes
  if (
    cleanName.includes('orchid') ||
    cleanName.includes('dandelion') ||
    cleanName.includes('poppy') ||
    cleanName.includes('cornflower') ||
    cleanName.includes('tulip') ||
    cleanName.includes('daisy') ||
    cleanName.includes('lily') ||
    cleanName.includes('rose') ||
    cleanName.includes('sunflower') ||
    cleanName.includes('flower') ||
    cleanName.includes('allium') ||
    cleanName.includes('bluet') ||
    cleanName.includes('peony') ||
    cleanName.includes('lilac') ||
    cleanName.includes('dye') ||
    cleanName.includes('wheat') ||
    cleanName.includes('seed') ||
    cleanName.includes('carrot') ||
    cleanName.includes('potato') ||
    cleanName.includes('beetroot') ||
    cleanName.includes('melon') ||
    cleanName.includes('pumpkin') ||
    cleanName.includes('sugar_cane') ||
    cleanName.includes('cactus') ||
    cleanName.includes('bamboo') ||
    cleanName.includes('kelp') ||
    cleanName.includes('pickle') ||
    cleanName.includes('vine') ||
    cleanName.includes('berry') ||
    cleanName.includes('berries') ||
    cleanName.includes('cocoa') ||
    cleanName.includes('apple') ||
    cleanName.includes('bread') ||
    cleanName.includes('mushroom') ||
    cleanName.includes('fungus') ||
    cleanName.includes('fern') ||
    cleanName.includes('grass') ||
    cleanName.includes('moss') ||
    cleanName.includes('azalea') ||
    cleanName.includes('leaves') ||
    cleanName.includes('sapling') ||
    (block?.material && (
      block.material.includes('plant') ||
      block.material.includes('leaves') ||
      block.material.includes('gourd')
    ))
  ) {
    return 'Farming';
  }

  // 6. Wood products
  const isWoodSpecies = WOOD_SPECIES.some((species) => cleanName.startsWith(species));
  if (
    isWoodSpecies ||
    cleanName.includes('log') ||
    cleanName.includes('wood') ||
    cleanName.includes('planks') ||
    cleanName.includes('stick') ||
    cleanName.includes('fence') ||
    cleanName.includes('gate') ||
    cleanName.includes('door') ||
    cleanName.includes('trapdoor') ||
    cleanName.includes('sign') ||
    cleanName.includes('boat') ||
    cleanName.includes('chest') ||
    cleanName.includes('barrel') ||
    cleanName.includes('bookshelf') ||
    cleanName.includes('ladder') ||
    cleanName.includes('bowl')
  ) {
    // Exclude iron/stone doors or signs if any
    if (!cleanName.includes('iron') && !cleanName.includes('stone') && !cleanName.includes('brick')) {
      return 'Wood';
    }
  }

  // 7. Processing (Smelted, manufactured mechanisms & workstations)
  if (
    cleanName.includes('glass') ||
    cleanName.includes('terracotta') ||
    cleanName.includes('brick') ||
    cleanName.includes('concrete') ||
    cleanName.includes('smooth_stone') ||
    cleanName.includes('smooth_sandstone') ||
    cleanName.includes('smooth_quartz') ||
    cleanName.endsWith('_ingot') ||
    cleanName.endsWith('_block') ||
    cleanName.endsWith('_nugget') ||
    cleanName.includes('iron_bars') ||
    cleanName.includes('chain') ||
    cleanName.includes('lantern') ||
    cleanName.includes('anvil') ||
    cleanName.includes('crafter') ||
    cleanName.includes('hopper') ||
    cleanName.includes('dispenser') ||
    cleanName.includes('dropper') ||
    cleanName.includes('observer') ||
    cleanName.includes('piston') ||
    cleanName.includes('comparator') ||
    cleanName.includes('repeater') ||
    cleanName.includes('redstone_torch') ||
    cleanName.includes('target') ||
    cleanName.includes('daylight_detector') ||
    cleanName.includes('lightning_rod') ||
    cleanName.includes('rail') ||
    cleanName.includes('minecart') ||
    cleanName.includes('cauldron') ||
    cleanName.includes('composter') ||
    cleanName.includes('furnace') ||
    cleanName.includes('smoker') ||
    cleanName.includes('blast_furnace') ||
    cleanName.includes('stonecutter') ||
    cleanName.includes('grindstone') ||
    cleanName.includes('smithing_table') ||
    cleanName.includes('loom') ||
    cleanName.includes('cartography_table') ||
    cleanName.includes('brewing_stand') ||
    cleanName.includes('tnt') ||
    cleanName.includes('crafting_table')
  ) {
    return 'Processing';
  }

  // 8. Mining (Natural ores, stones, earths mined in overworld caves/surface)
  if (
    cleanName.includes('stone') ||
    cleanName.includes('cobble') ||
    cleanName.includes('granite') ||
    cleanName.includes('diorite') ||
    cleanName.includes('andesite') ||
    cleanName.includes('deepslate') ||
    cleanName.includes('tuff') ||
    cleanName.includes('calcite') ||
    cleanName.includes('dripstone') ||
    cleanName.includes('ore') ||
    cleanName.includes('raw_') ||
    cleanName.includes('coal') ||
    cleanName.includes('diamond') ||
    cleanName.includes('emerald') ||
    cleanName.includes('lapis') ||
    cleanName.includes('redstone') ||
    cleanName.includes('copper') ||
    cleanName.includes('amethyst') ||
    cleanName.includes('dirt') ||
    cleanName.includes('sand') ||
    cleanName.includes('gravel') ||
    cleanName.includes('clay') ||
    cleanName.includes('mud') ||
    cleanName.includes('flint') ||
    cleanName.includes('obsidian') ||
    cleanName.includes('ice')
  ) {
    return 'Mining';
  }

  return 'Other';
}

