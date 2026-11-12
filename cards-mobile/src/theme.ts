// Shared colors and fonts, copied from the web frontend's Tailwind classes.

export const colors = {
  burgundy: '#8b3d4b', // bg-[#8b3d4b]  (buttons, focus, logo)
  burgundyPressed: '#72323e', // hover:bg-[#72323e]
  page: '#f7f5f0', // bg-[#f7f5f0]  (screen background)
  cream: '#FAF5EE', // bg-[#FAF5EE]  (dashboard panels; the login card is white)
  white: '#ffffff',
  // Tailwind's "stone" grays
  stone50: '#fafaf9',
  stone100: '#f5f5f4',
  stone200: '#e7e5e4',
  stone500: '#78716c',
  stone800: '#292524',
  stone900: '#1c1917',
};

// Each weight is its own font file, so each gets its own name.
// These names must match the keys loaded with useFonts in src/app/_layout.tsx.
export const fonts = {
  heading: 'Lora_600SemiBold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
};
