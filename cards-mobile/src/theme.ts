// Shared colors and fonts, copied from the web frontend's Tailwind classes.

export const colors = {
  burgundy: '#8b3d4b', // bg-[#8b3d4b]  (buttons, focus, logo)
  burgundyPressed: '#72323e', // hover:bg-[#72323e]
  page: '#f7f5f0', // bg-[#f7f5f0]  (screen background)
  cream: '#FAF5EE', // bg-[#FAF5EE]  (dashboard panels; the login card is white)
  white: '#ffffff',
  // Dashboard's warm browns (web Log Out button)
  brown: '#6C5B4F', // text-[#6C5B4F]
  brownDark: '#2C211B', // hover:text-[#2C211B]
  tan: '#CFBEAA', // border-[#CFBEAA]
  tanDark: '#7B6A5E', // hover:border-[#7B6A5E]
  // Dashboard reminders panel
  panelBorder: '#DFD3C3', // border-[#DFD3C3]
  doneBg: 'rgba(236, 225, 210, 0.5)', // bg-[#ECE1D2]/50  (checked-off reminder)
  doneBorder: 'rgba(207, 190, 170, 0.6)', // border-[#CFBEAA]/60
  doneText: '#9C8A7C', // text-[#9C8A7C]  (struck-through title)
  sand: '#ECE1D2', // hover:bg-[#ECE1D2]  (pressed "Edit")
  green: '#355E48', // accent for pending reminders
  greenDark: '#1E3E2D', // text on green badges
  greenSoft: 'rgba(53, 94, 72, 0.15)', // bg-[#355E48]/15
  greenBorder: 'rgba(53, 94, 72, 0.3)', // border-[#355E48]/30
  pink: '#A85368', // accent for completed reminders; also the "Del" button text
  pinkDark: '#632736', // hover:text-[#632736]  (pressed "Del")
  pinkSoft: 'rgba(168, 83, 104, 0.1)', // hover:bg-[#A85368]/10  (pressed "Del")
  error: '#b91c1c', // text-red-700  (error messages)
  success: '#15803d', // text-green-700  (success messages)
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
