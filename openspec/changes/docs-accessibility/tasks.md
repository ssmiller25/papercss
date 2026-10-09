# Tasks

## 1. Language and landmarks

- [ ] 1.1 Add the missing `lang` attribute to the documentation base template, and verify `element-required-attributes` reaches zero in the page-chrome region of `make check-docs`
- [ ] 1.2 Give each repeated landmark region a non-empty, unique accessible name, and verify `unique-landmark` reaches zero in the page-chrome region

## 2. Form controls

- [ ] 2.1 Give every form control in the page chrome an associated label and a unique `name`, and verify `wcag/h71` and `form-dup-name` reach zero
- [ ] 2.2 Add a `legend` to every `fieldset` in the page chrome, and verify no group is left without a description

## 3. Buttons and element closure

- [ ] 3.1 Add an explicit `type` to every button in the page chrome and convert `input`-as-button controls to real `<button>` elements, and verify `no-implicit-button-type` and `prefer-button` reach zero
- [ ] 3.2 Remove redundant `for` attributes and close every implicitly closed element, and verify `no-redundant-for` and `no-implicit-close` reach zero

## 4. Tighten the baseline

- [ ] 4.1 Tighten the page-chrome region's recorded baseline to zero in this same change, and verify a deliberately introduced chrome violation fails the documentation gate
- [ ] 4.2 Verify the demo region's baseline is unchanged, so the demo contract is not credited with the chrome region's progress
