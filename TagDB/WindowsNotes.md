# TagDB Notes for Windows

## General Notes

* You'll be using an app called `git bash` in this process. It is like `PowerShell`, but is a Linux-style shell. This allows more scripts to work between Windows, Mac, and Linux. In these instructions I will refer to it simply as `bash`.
* You'll need to run `PowerShell` and `git bash` as Adminstrator. The easiest way to do this is type their name (e.g. PowerShell) into the windows search box on the tag bar. When the results pop up you'll see the desired app on the top left. Right click it and choose `Run as Administrator`

## One-Time Tools Installation

### Install *git bash*

To install bash, we need to use `PowerShell`. Launch it as administrator using the instructions given above. When it is open, type:

`winget install --id Git.Git -e --source winget`

### Install *chocolately*, the Windows package manager

Copy and paste the entire text block below into `PowerShell` then press `Enter`

```
Set-ExecutionPolicy Bypass -Scope Process -Force; `
[System.Net.ServicePointManager]::SecurityProtocol = `
[System.Net.ServicePointManager]::SecurityProtocol -bor 3072; `
$webClient = New-Object System.Net.WebClient; `
$script = $webClient.DownloadString('https://community.chocolatey.org/install.ps1'); `
iex $script
```

### Install *jq*, the JSON formatter
Start by opening bash as Administrator using the instructions given above. Once open, type:

`choco install jq -y`

### Install MySQL
In the same bash window use the two commands below to install *MySQL* and *MySQL Workbench*:

```
choco install mysql -y
choco install mysql.workbench -y
```

### Install node.js
In the same bash window type:

`choco install nodejs -y`

## One-time TagDB Setup

### Download the TagDB project

Choose a development folder where you'd like to place TagDB then download it from github. You can do this by navigating to the [repo](https://github.com/jpasqua/TagDB) and downloading a zip file, or by using the following command in *bash*:

```
wget --header="Authorization: token TOKEN_GOES_HERE" \
     -O TagDB.zip \
	  https://github.com/jpasqua/TagDB/archive/refs/heads/main.zip
```

Unzip the downloaded file (`TagDB.zip`). You will end up with a folder named TagDB-main. Rename it to TagDB.

### Install the required node modules

The necessary node modules are not part of the repo. You need to download them. In *bash*, navigate to the TagDB directory (e.g. `cd TagDB`) and type:

`npm install`

### Prepare MySQL
1. Launch the MySQL Workbench app
2. Click on "**Local instance MySQL**"
3. Open the `tagdb.sql` script:
   1. Select: `File->Open SQL Script`
   2. Select `tagdb` in the TagDB folder
   3. A new tab will open named `tagdb`
4. Run the script using the lightning bolt icon or the `Query` menu. You will see the user `taguser` being created and then all the required tables.

## Launch TagDB

You are now ready to launch *TagDB* by typing the following into *bash*:

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

