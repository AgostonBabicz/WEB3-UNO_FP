const seconds: number[] = [1, 1.5, 2, 2.5, 3]

export function randomDelay() {
  const length = seconds.length
  const randIndex = Math.floor(Math.random() * length)
  return seconds[randIndex] * 1000
}
