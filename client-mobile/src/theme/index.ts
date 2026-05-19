export const getTheme = (isDark: boolean) => ({
  bg:          isDark ? '#13141a' : '#f4f7f6',
  card:        isDark ? '#1c1e26' : '#ffffff',
  text:        isDark ? '#e8eaf0' : '#1a1a1a',
  subtext:     isDark ? '#9095a0' : '#868e96',
  border:      isDark ? '#272932' : '#f0f0f0',
  inputBg:     isDark ? '#272932' : '#ffffff',
  inputBorder: isDark ? '#33363f' : '#dee2e6',
  placeholder: isDark ? '#5a5e6a' : '#adb5bd',
  tabBar:      isDark ? '#1c1e26' : '#ffffff',
  tabBorder:   isDark ? '#272932' : '#e9ecef',
  iconCircle:  isDark ? '#272932' : '#f9fafb',
  unreadCard:  isDark ? '#1a2030' : '#f0f9ff',
  searchBg:    isDark ? '#272932' : '#ffffff',
});

export type Theme = ReturnType<typeof getTheme>;
