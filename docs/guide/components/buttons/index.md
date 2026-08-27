# Buttons

Buttons are used to perform an action. The main buttons in the application are
the `primary` and `secondary` buttons. Buttons, like all Boostrap-vue components
can be themed by setting the `variant` prop on the component to one of the
[theme-color map keys](/guide/guidelines/colors). To create a button that looks
like a link, set the variant value to `link`.

[Learn more about Bootstrap-vue-next buttons](https://bootstrap-vue-next.github.io/bootstrap-vue-next/docs/components/button.html)

### Icon only buttons

Add `btn-icon-only` class to the button and add `title` attribute to get helper
text on hover over the button.

### Enabled buttons

![Button examples](./button.png)

```vue
// Enabled Buttons
<BButton variant="primary">Primary</BButton>
<BButton variant="primary">
  <icon-add />
  <span>Primary with icon</span>
</BButton>
<BButton variant="secondary">Secondary</BButton>
<BButton variant="danger">Danger</BButton>
<BButton variant="link">Link Button</BButton>
<BButton variant="link">
  <icon-add />
  <span>Link Button</span>
</BButton>
<BButton variant="link" title="Delete" class="btn-icon-only">
  <icon-trashcan />
</BButton>
```

### Disabled buttons

![Disabled button examples](./button-disabled.png)

```vue
// Disabled Buttons
<BButton disabled variant="primary">Primary</BButton>
<BButton disabled variant="primary">
  <icon-add />
  <span>Primary with icon</span>
</BButton>
<BButton disabled variant="secondary">Secondary</BButton>
<BButton disabled variant="danger">Danger</BButton>
<BButton disabled variant="link">Link Button</BButton>
<BButton disabled variant="link">
  <icon-add />
  <span>Link Button</span>
</BButton>
<BButton disabled variant="link" title="Delete" class="btn-icon-only">
  <icon-trashcan />
</BButton>
```
