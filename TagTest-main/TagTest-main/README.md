# TagTest

## Prerequisites

It is assumed you have already installed:
* **Node.js**
* **git bash** (Windows Users Only)

## Installation

Download the [repo](https://github.com/jpasqua/TagTest) from GitHub using the web UI or with the following command in *bash*:

```
wget --header="Authorization: token TOKEN_GOES_HERE" \
     -O TagTest.zip \
	  https://github.com/jpasqua/TagTest/archive/refs/heads/main.zip
```

Unzip the downloaded file (`TagTest.zip`). You will end up with a folder named TagTest-main. Rename it to TagTest.

The necessary node modules are not part of the repo. You need to download them. In *bash*, navigate to the TagTest directory (e.g. `cd TagTest`) and type:

`npm install`

## Running TagTest

In *bash*, navigate to the TagTest directory (e.g. `cd TagTest`) and type:

`npm run dev`

Once TagTest begins running, you'll get output that looks like this:

```
  VITE v5.4.5  ready in 86 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

If you press h + enter, you will see:

```
h

  Shortcuts
  press r + enter to restart the server
  press u + enter to show server url
  press o + enter to open in browser
  press c + enter to clear console
  press q + enter to quit
```

At this type `o` and press enter to open TagTest in a browser window.

When you are done, you may type `q` and press enter to end the App.

***Windows Note***: You may find that when you perform the `npm run dev`, you are not given the option to enter shortcuts like `o`. If that happens, just open a browser and navigate to: [http://localhost:5173/](http://localhost:5173/).

## Developer Notes

This project was initially created using the following steps:

```bash
npm create vite@latest TagTest --template react
npm install axios
```

