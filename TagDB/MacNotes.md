# TagDB Notes for Mac

These notes describe the setup and operation of TagDB on the Mac platform. Though very similar conceptually to the process on Windows, it is different in the details.

## One-Time Tools Installation

### Install *Homebrew*

Homebrew, also know as *brew*, is a package manager for the Mac: "Homebrew installs the stuff you need that Apple didn’t." If you don't already have Homebrew installed, you can install it by copying the command below into a terminal:

```
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

When installation completes, there will be a "Next Steps" in the Terminal. Be sure to follow those steps.

### Install a modern version of *bash*
Copy the following command into the Terminal:

```
brew install bash
```

### Install *jq*, the JSON formatter
Copy the following command into the Terminal:

```
brew install jq
```

### Install MySQL
Copy the follwing commands into the terminal to install *MySQL* and *MySQL Workbench*:

```
brew install mysql@8.0
brew link --force mysql@8.0
brew install --cask mysqlworkbench
```

To start or stop the MySQL Database service at any time enter the corresponding command below:

```
brew services start mysql@8.0
brew services stop mysql@8.0
```

### Install node.js
Copy the following command into the Terminal::

```
brew install node
```

## One-time TagDB Setup

### Install the required node modules

The necessary node modules are not part of the repo. You need to download them. In *bash*, navigate to the TagDB directory (e.g. `cd TagDB`) and type:

```
npm install
```

### Prepare MySQL
1. Launch the MySQL Workbench app
2. Click on "**Local instance MySQL**"
3. Open the `tagdb.sql` script:
   1. Select: `File->Open SQL Script`
   2. Select `tagdb` in the TagDB folder
   3. A new tab will open named `tagdb`
4. Run the script using the lightning bolt icon or the `Query` menu. You will see the user `taguser` being created and then all the required tables.

## Launch TagDB

You are now ready to launch *TagDB* by typing the following into *bash* (Windows) or *Terminal* (Mac):

`node tagdb.js`

You may get a security popup asking if it is OK for *TagDB* to use the network. Allow it. You will see the following output in *bash*:

```
Server running on port 3000
MySQL connected...
```

Just leave that window running - it is the TagDB service.

## Populating TagDB with Sample Data

Create another *bash* window by right clicking the *Git Bash* icon in the task bar. A menu will pop up. Select `Git Bash` and a new window will open. In the newly opened window, navigate to the TagDB directory (e.g. c`d TagDB`) then type:

`./populate.sh`

You will see quite a few messages pass by as it add files, tags, and then tags the files.
Eventually you'll see the output from several sample tag queries. These will show that
TagDB is populated and operating.

## After Setup

Once you have setup and populated *TagDB* then using it in the future is easy. Just open *bash* and type:

`node tagdb.js`

It will launch, connect to MySQL, and become available via its REST API. To stop the service just type `CTRL-C` to *bash*.

