// All structured texts of the site. The one longer text is Markdown: src/pages/privacy.md.

export type LaunchStatus = 'announced' | 'preorder' | 'released';

export const app = {
  name: 'Karacho',
  tagline: 'Your GPS speed in big amber digits.',
  author: 'Peter Kurzok',
  email: 'karacho@peterkurzok.de',
  // Both stay empty until the app is in the App Store. 'preorder' and 'released' need them:
  // the badge links to appStoreUrl, and the Smart App Banner tag is written from appStoreId.
  appStoreId: '',
  appStoreUrl: '',
  // The one value to change: 'preorder' after App Review, 'released' on launch day.
  status: 'announced' as LaunchStatus,
  badge: {
    preorder: { file: 'app-store-preorder', alt: 'Pre-order on the App Store' },
    released: { file: 'app-store-download', alt: 'Download on the App Store' },
  },
  // While the status is 'announced' the two calls to action are buttons; afterwards they are
  // the App Store badge of the status.
  heroCta: { label: 'Coming soon: see it in action', href: '#screenshots' },
  downloadCta: { label: 'Write to me', href: 'mailto:karacho@peterkurzok.de' },
  downloadText: {
    announced:
      'Coming to the App Store for iPhone. Free to use; Pro, a one-time purchase, adds the Siri answer and your speed on the Lock Screen.',
    preorder:
      'Available for pre-order on the App Store for iPhone. Free to use; Pro, a one-time purchase, adds the Siri answer and your speed on the Lock Screen.',
    released:
      'Available now on the App Store for iPhone. Free to use; Pro, a one-time purchase, adds the Siri answer and your speed on the Lock Screen.',
  } as Record<LaunchStatus, string>,
};

// Entries starting with "#" are sections of the homepage.
export const nav = [
  { label: 'Features', href: '#features' },
  { label: 'Screenshots', href: '#screenshots' },
  { label: 'Support', href: '#support' },
];

export const navCta = { label: 'Get the app', href: '#download' };

export const footerLinks = [
  { label: 'Privacy Policy', href: '/privacy/' },
  { label: 'Terms of Service', href: 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula' },
  { label: 'Imprint', href: 'https://apps.peterkurzok.de/imprint' },
  { label: 'More Apps', href: 'https://apps.peterkurzok.de' },
];

export const social = [
  { icon: 'mastodon', label: 'Mastodon', href: 'https://kind.social/@filmaniac' },
  { icon: 'github', label: 'GitHub', href: 'https://github.com/pkurzok' },
] as const;

export const copyright = '© 2026 Peter Kurzok';

export const hero = {
  title: 'Your speed, nothing else.',
  subtitle:
    'Karacho is a digital speedometer for iPhone: your GPS speed in big amber digits you can read at a glance, in the car, on the bike or on foot.',
  trust: ['No account', 'No analytics', 'Free to use'],
  // A file in src/assets/images/screenshots/.
  image: 'iphone-01-driving.jpg',
  imageAlt: 'Karacho on iPhone, showing the current speed in large amber digits',
};

export const sections = {
  screenshots: {
    title: 'A look at the dial',
    description: 'One number, and a small symbol for how you are travelling.',
  },
  features: {
    title: 'Built to be read at a glance',
    description: 'A speedometer that shows your speed and stays out of the way.',
  },
  // The section id is "support": the App Store listing links to /#support.
  support: {
    title: 'Support',
    description: 'Something not working, or an idea? Write to karacho@peterkurzok.de. I read every message.',
  },
  download: { title: 'Get Karacho' },
};

export const features = [
  {
    icon: 'speedometer2',
    title: 'Big digits',
    text: 'Seven-segment digits fill the screen, amber on near-black. A steady 0 when you stand still, and the screen stays on while Karacho is open.',
  },
  {
    icon: 'bicycle',
    title: 'Knows how you travel',
    text: 'Karacho tells walking, cycling and driving apart, and lights the matching symbol beside your speed. It does not snap to roads, so it works on a train or a boat too.',
  },
  {
    icon: 'arrow-left-right',
    title: 'km/h or mph',
    text: 'The unit follows your region. If you would rather choose, it is one switch in the settings.',
  },
  {
    icon: 'mic',
    title: 'Ask Siri',
    text: 'With Pro: ask "How fast am I going with Karacho?" and hear the answer, with the number on a small card, without opening the app.',
  },
  {
    icon: 'lock',
    title: 'Lock Screen and Dynamic Island',
    text: 'With Pro: your speed stays visible as a Live Activity while the iPhone is locked or another app is in front.',
  },
  {
    icon: 'shield-lock',
    title: 'Private by design',
    text: 'Your speed is worked out on the iPhone. Karacho never reads or stores where you are, only how fast you are moving. No account, no analytics.',
  },
] as const;

export const faq = [
  {
    question: 'What do I need to run Karacho?',
    answer:
      'An iPhone with iOS 26 or later, and location access for Karacho. For the walking, cycling and driving symbols it also needs Motion & Fitness access; without it you still get the speed.',
  },
  {
    question: 'Why does the dial show three dashes?',
    answer:
      'Karacho has no GPS speed yet. Indoors and between tall buildings a first fix can take a little while. If the dashes stay, check Settings → Privacy & Security → Location Services → Karacho: access must be allowed and Precise Location switched on.',
  },
  {
    question: 'Why is no travel symbol lit?',
    answer:
      'Standing still lights none: the iPhone reports no activity then. If the symbols are missing altogether, Motion & Fitness access is switched off for Karacho in Settings.',
  },
  {
    question: 'What does Pro add?',
    answer:
      'Two things: Siri answers "How fast am I going with Karacho?" without opening the app, and your speed stays on the Lock Screen and in the Dynamic Island while the iPhone is locked. Pro is a one-time purchase, with no subscription.',
  },
  {
    question: 'How accurate is the speed?',
    answer:
      'It is the speed GPS reports, smoothed so that the number does not jitter. It is usually closer to your true speed than a car speedometer, which reads a little high by design. In tunnels and without a view of the sky there is no GPS speed, and Karacho says so instead of guessing.',
  },
  {
    question: 'Does Karacho use my location in the background?',
    answer:
      'Only in two cases: while your speed is showing on the Lock Screen, and for a few seconds when you ask Siri for your speed. Otherwise Karacho reads your location only while it is open.',
  },
  {
    question: 'Do you collect any data about me?',
    answer:
      'No. There is no account, no analytics and no crash reporting. Karacho reads how fast you are moving, never where you are, and nothing about your location or your movement leaves the iPhone. The privacy policy has the details.',
  },
  {
    question: 'What do the tips unlock?',
    answer:
      'Nothing. "Buy me a coffee" and "Buy me lunch" in Settings are optional ways to support development. Pro is the purchase that adds Siri and the Lock Screen.',
  },
  {
    question: 'How do I get in touch?',
    answer: 'Write to karacho@peterkurzok.de.',
  },
];

// Files in src/assets/images/screenshots/, copied from the app repository by
// `make site-assets SITE=<this folder>`. They are the en-US set, which shows mph: alt texts and
// captions name no number, so they stay true when the images are re-shot.
export const screenshots = [
  {
    file: 'iphone-01-driving.jpg',
    alt: 'Your speed, nothing else',
    caption: 'Your speed in big amber digits, with the car symbol lit',
  },
  {
    file: 'iphone-02-cycling.jpg',
    alt: 'Walk, ride or drive',
    caption: 'Karacho lights the bicycle when you are cycling',
  },
  {
    file: 'iphone-03-walking.jpg',
    alt: 'km/h or mph',
    caption: 'The unit follows your region, even at walking pace',
  },
  {
    file: 'iphone-04-siri.jpg',
    alt: 'Just ask Siri',
    caption: 'With Pro, Siri answers with your speed on a card',
  },
  {
    file: 'iphone-05-lockscreen.jpg',
    alt: 'On your Lock Screen',
    caption: 'With Pro, your speed stays visible while the iPhone is locked',
  },
] as const;

// The paths the sitemap lists.
export const pages = ['/', '/privacy/'];
