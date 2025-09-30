import DefaultTheme from 'vitepress/theme'
import All from '../components/colors/all.vue'
import Blues from '../components/colors/blues.vue'
import Grays from '../components/colors/grays.vue'
import Greens from '../components/colors/greens.vue'
import Reds from '../components/colors/reds.vue'
import Yellows from '../components/colors/yellows.vue'
import Theme from '../components/colors/theme.vue'

export default {
  ...DefaultTheme,
  enhanceApp({ app }) {
    app.component('colors-all', All)
    app.component('colors-blues', Blues)
    app.component('colors-grays', Grays)
    app.component('colors-greens', Greens)
    app.component('colors-reds', Reds)
    app.component('colors-yellows', Yellows)
    app.component('colors-theme', Theme)
  }
}