/**
 * Recognisable sibling behaviours, and how to spot them in an answer.
 *
 * The offline generator reads the user's answers for these to decide which
 * universe the sibling belongs in. It is only a detector — the vocabulary that
 * used to live here belonged to the annual review, which no longer exists.
 */
export interface Trait {
  id: string
  /** Matched against the user's raw answers. */
  test: RegExp
}

export const TRAITS: Trait[] = [
  { id: 'food', test: /\b(food|eat|eats|eating|snack|snacks|hungry|pizza|burger|chocolate|maggi|biryani|fridge|plate|momos|noodles|chips|cake|leftovers?)\b/i },
  { id: 'sleep', test: /\b(sleep|sleeps|sleeping|nap|naps|bed|lazy|wake|woke|alarm|snooze|tired|blanket)\b/i },
  { id: 'shopping', test: /\b(shoe|shoes|sneaker|clothes|shop|shopping|buy|buys|dress|makeup|amazon|myntra|cart|sale|haul|skincare|bag|bags)\b/i },
  { id: 'phone', test: /\b(phone|instagram|insta|reels|scroll|scrolling|screen|whatsapp|online|text|texts|snap|tiktok|reply|replies|replying|seen)\b/i },
  { id: 'gaming', test: /\b(game|games|gaming|gamer|pubg|bgmi|valorant|xbox|playstation|ps5|console|fifa|minecraft|steam|controller)\b/i },
  { id: 'steal', test: /\b(steal|steals|stole|stealing|hoodie|charger|shirt|jacket|socks|borrow|borrows|took|takes|earphone|headphone|perfume)\b/i },
  { id: 'drama', test: /\b(drama|fight|fights|argue|argues|shout|shouts|tantrum|mood|moody|attitude|sulk|angry|annoy|annoys|annoying|irritat|bug|bugs|tease|nag)\b/i },
  { id: 'mess', test: /\b(mess|messy|dirty|clean|room|laundry|organiz|organis|clutter|towel|plates?|wash)\b/i },
  { id: 'study', test: /\b(study|studies|exam|exams|topper|marks|school|college|assignment|homework|degree|class|deadline)\b/i },
  { id: 'music', test: /\b(music|sing|sings|singing|guitar|dance|dances|song|songs|playlist|piano|loud|speaker)\b/i },
  { id: 'cooking', test: /\b(cook|cooks|cooking|bake|bakes|baking|chef|recipe|kitchen)\b/i },
  { id: 'talent', test: /\b(good at|talent|talented|skill|skilled|draw|draws|art|paint|design|fix|fixes|code|codes|photo|write|writes)\b/i },
  { id: 'support', test: /\b(support|supportive|there for|listen|listens|help|helps|care|cares|protect|comfort|show up|shows up|advice|calm|safe)\b/i },
  { id: 'funny', test: /\b(funny|laugh|laughs|joke|jokes|humour|humor|meme|memes|silly|comedy)\b/i },
]
