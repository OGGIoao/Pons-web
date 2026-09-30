import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { execFileSync } from 'node:child_process'
import { defineConfig } from 'vite'

// 构建期内容管线：把 ../pons-clone/patterns/*.md 解析成 src/generated/cards.json。
// 单一事实来源是 markdown 仓库；这里是唯一的消费者，禁止手改生成物。
function ponsCards() {
  return {
    name: 'pons-cards',
    buildStart() {
      execFileSync('node', ['scripts/build-cards.mjs'], { stdio: 'inherit' })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), ponsCards()],
})
