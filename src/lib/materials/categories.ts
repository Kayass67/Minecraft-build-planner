import { GatheringCategory } from './types';

// A simple deterministic heuristic mapping for MVP
export function getGatheringCategory(itemName: string): GatheringCategory {
  const name = itemName.toLowerCase();

  if (name.includes('log') || name.includes('wood') || name.includes('planks') || name.includes('sapling') || name.includes('leaves')) {
    return 'Wood';
  }
  
  if (name.includes('stone') || name.includes('ore') || name.includes('cobble') || name.includes('granite') || name.includes('diorite') || name.includes('andesite') || name.includes('diamond') || name.includes('iron') || name.includes('gold') || name.includes('coal') || name.includes('lapis') || name.includes('redstone') || name.includes('copper') || name.includes('raw_')) {
    return 'Mining';
  }

  if (name.includes('wheat') || name.includes('carrot') || name.includes('potato') || name.includes('beetroot') || name.includes('seed') || name.includes('melon') || name.includes('pumpkin') || name.includes('sugar_cane') || name.includes('kelp') || name.includes('bamboo')) {
    return 'Farming';
  }

  if (name.includes('bone') || name.includes('flesh') || name.includes('string') || name.includes('spider') || name.includes('gunpowder') || name.includes('slime') || name.includes('ender_pearl') || name.includes('leather') || name.includes('wool') || name.includes('meat') || name.includes('beef') || name.includes('pork') || name.includes('chicken') || name.includes('mutton') || name.includes('feather') || name.includes('egg')) {
    return 'Mob/Organic';
  }

  if (name.includes('nether') || name.includes('quartz') || name.includes('soul') || name.includes('magma') || name.includes('glowstone') || name.includes('blaze') || name.includes('ghast') || name.includes('wart') || name.includes('crimson') || name.includes('warped') || name.includes('blackstone') || name.includes('basalt')) {
    return 'Nether';
  }

  if (name.includes('end_') || name.includes('purpur') || name.includes('chorus') || name.includes('shulker') || name.includes('elytra') || name.includes('dragon')) {
    return 'End';
  }

  return 'Other';
}
