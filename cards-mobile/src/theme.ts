// Shared colors and fonts, copied from the web frontend's Tailwind classes
// (cards-frontend/src/LoginPage.tsx and Dashboard.tsx).

export const colors = {
  page: '#F4EDE4', // bg-[#F4EDE4]  (screen background, login and dashboard)
  cream: '#FAF5EE', // bg-[#FAF5EE]  (cards and panels, login card included)
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
  // Dashboard calendar
  calBorder: '#D5C6B3', // border-[#D5C6B3]  (panel border, lines between days)
  calHeader: '#F2E8DC', // bg-[#F2E8DC]  (month title bar)
  weekdayBg: '#EAE0D1', // bg-[#EAE0D1]  (Sun–Sat row)
  weekdayText: '#5C4A3E', // text-[#5C4A3E]
  // Main brand color: logo, main buttons, focused inputs, links, active tab, spinners
  espresso: '#4E2E1E', // bg-[#4E2E1E]
  espressoPressed: '#3D2214', // hover:bg-[#3D2214]
  placeholder: '#AFA193', // placeholder-[#AFA193]  (all inputs)
  espressoRing: 'rgba(78, 46, 30, 0.4)', // ring-[#4E2E1E]/40  (today's cell)
  todayBg: '#FDF9F2', // bg-[#FDF9F2]  (today's cell)
  outsideBg: 'rgba(250, 245, 238, 0.6)', // bg-[#FAF5EE]/60  (days from next/previous month)
  pink: '#A85368', // accent for completed reminders; also the "Del" button text
  pinkDark: '#632736', // hover:text-[#632736]  (pressed "Del")
  pinkSoft: 'rgba(168, 83, 104, 0.1)', // hover:bg-[#A85368]/10  (pressed "Del")
  pinkTint: 'rgba(168, 83, 104, 0.15)', // bg-[#A85368]/15  (web event Delete button)
  pinkBorder: 'rgba(168, 83, 104, 0.3)', // border-[#A85368]/30
  // Messages (web login banners). The login, register and forgot password
  // screens use all three as a banner; elsewhere errors are just the text color.
  error: '#632736', // text-[#632736]
  errorBg: 'rgba(168, 83, 104, 0.12)', // bg-[#A85368]/12
  errorBorder: 'rgba(168, 83, 104, 0.3)', // border-[#A85368]/30
  success: '#1E3E2D', // text-[#1E3E2D]
  successBg: 'rgba(53, 94, 72, 0.12)', // bg-[#355E48]/12
  successBorder: 'rgba(53, 94, 72, 0.3)', // border-[#355E48]/30
};

// Each weight is its own font file, so each gets its own name.
// These names must match the keys loaded with useFonts in src/app/_layout.tsx.
export const fonts = {
  heading: 'Lora_600SemiBold',
  headingBold: 'Lora_700Bold', // web font-serif font-black (Lora tops out at 700)
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
};
