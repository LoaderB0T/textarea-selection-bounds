[![npm](https://img.shields.io/npm/v/textarea-selection-bounds?color=%2300d26a&style=for-the-badge)](https://www.npmjs.com/package/textarea-selection-bounds)
[![Demo Codepen](https://img.shields.io/badge/demo-codepen-blue?style=for-the-badge&logo=codepen)](https://codepen.io/Janik-Schumacher/pen/gOyGxed)
[![Build Status](https://img.shields.io/github/actions/workflow/status/LoaderB0T/textarea-selection-bounds/build.yml?branch=main&style=for-the-badge)](https://github.com/LoaderB0T/textarea-selection-bounds/actions/workflows/build.yml)
[![Sonar Quality Gate](https://img.shields.io/sonar/quality_gate/LoaderB0T_textarea-selection-bounds?server=https%3A%2F%2Fsonarcloud.io&style=for-the-badge)](https://sonarcloud.io/summary/new_code?id=LoaderB0T_textarea-selection-bounds)
[![bundle size](https://img.shields.io/bundlephobia/minzip/textarea-selection-bounds?color=%23FF006F&label=Bundle%20Size&style=for-the-badge)](https://bundlephobia.com/package/textarea-selection-bounds)

# textarea-selection-bounds

Easily get the bounds of a selection in a textarea or text input element.

## Motivation 💥

**textarea-selection-bounds** is a simple library that allows you to get the bounds of a selection in a textarea or text input element. It is written in TypeScript and has no dependencies. It is perfect to overlay content on top of a textarea or text input element that should follow the selection.

`top` & `left` are the coordinates of the top-left corner of the selection. They are relative to the window. `width` & `height` are the dimensions of the selection.

## Demo 🚀

See the [Codepen](https://codepen.io/Janik-Schumacher/pen/gOyGxed) for a live demo.

## Features 🔥

✅ Get top, left, width, and height of a selection in a textarea or text input element.

✅ Zero dependencies.

✅ Strongly typed.

## Built With 🔧

- [TypeScript](https://www.typescriptlang.org/)

## Installation 📦

```console
pnpm i textarea-selection-bounds
// or
yarn add textarea-selection-bounds
// or
npm i textarea-selection-bounds
```

## Usage Example 🚀

```typescript
import { TextareaSelectionBounds } from "./textarea-selection-bounds";
```

```typescript
const textArea = document.querySelector('textarea');
if (textArea) {
  const bounds = new TextareaSelectionBounds(textArea);
  console.log(bounds.getBounds());
}
```

## Contributing 🧑🏻‍💻

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License 🔑

Distributed under the MIT License. See `LICENSE.txt` for more information.

## Contact 📧

Janik Schumacher - [@LoaderB0T](https://twitter.com/LoaderB0T) - [linkedin](https://www.linkedin.com/in/janikschumacher/)

Project Link: [https://github.com/LoaderB0T/textarea-selection-bounds](https://github.com/LoaderB0T/textarea-selection-bounds)
