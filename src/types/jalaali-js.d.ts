declare module 'jalaali-js' {
  function toJalaali(gy: number, gm: number, gd: number): { jy: number; jm: number; jd: number }
  function toGregorian(jy: number, jm: number, jd: number): { gy: number; gm: number; gd: number }
  function isValidJalaaliDate(jy: number, jm: number, jd: number): boolean
  function isLeapJalaaliYear(jy: number): boolean
  function jalaaliMonthDays(jy: number, jm: number): number
}
