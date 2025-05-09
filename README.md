## Overview and Purpose.
The Bus App is a web application that allows admins in charge of bus communication to post information regarding the status of buses for pickup after school. Students can access this information from their phone remotely. The purpose of the app is to make communication easier which makes it easier for admins, makes students less likely to miss their bus or bus changes and allows students to do things after school without fear of missing their bus. 

## Intended Experience
To access the Bus App, all users should enter the website url (https://busapp.nnhsse.org/) into a browser. For convenience, it is recommended that users save this website to their phone’s homepage. 

This website can be saved to be used like a regular mobile application on Android and IOS devices. If using Google Chrome, users should click the three dots next to the URL bar and select 'add to homepage'. On Safari, users should click the 'send' icon, scroll down and select 'add to homescreen'. 

The below are the intended experiences for both admins and students:

#### Admin Experience
From the homepage, admins should click the “Login as editor” button in the top right and complete authentication via google on the login page. If they are on the whitelist, they will be redirected to the admin page.

From this page admins are able to edit bus changes, status (Not Here, Next Wave, Loading or Gone) and time. Time will update automatically when status is changed.

From the button labeled "Update Bus List," admins can change the default bus list. Entering a number into the button labeled "Add" and clicking the checkmark will add the bus, though the rest of the bus app will not change immediately. To save their changes, admins should click "Save Changes" to save the changes they've made and to update all active pages, or "Save Without Updating" to save them without updating the pages until the following day. They can also press "Discard Changes" to remove any changes they've made without saving. 

Additionally, admins are granted the ability to add or remove other admins from the whitelist, from the page directed to by the "Add New Admin" button. All admins are able to view the current whitelist at any time.

Adding an admin requires the email address of the admin to be added. Enter the new address and press the plus next to their name to add them. In the event that an admin must be removed, it is as simple as pressing the button next to their name. Remember to press the save button at the top of the page after making any changes (unless the change in unintentional, in which case the discard button can be utilized).

Administrator Handbook: https://docs.google.com/document/d/1MaySGjV3I7LIaNLHDQCaPODoN7ZUI3aYht6oijkWy_4/edit?usp=sharing

Admin Video Tutorial on Grey Out Busses, Wave System, and Editing and Viewing Announcements: https://drive.google.com/file/d/1okofo47q2vuZsaQ01qOejM5qpYVgVvP4/view

Video Tutorial primarily targeted towards future development teams: https://drive.google.com/file/d/1ulnChPS5pEHX3aqH_wu1c70YdODRildk/view?usp=sharing 

#### Student Experience 
On the home page, students have access to all the information they need. The page consists of  a bus table displaying Bus Number, Bus Change, Status and Time. Additionally, a panel displaying the weather is visible in the top right. 

Students should first check for a bus change when opening the app and then periodically check the status of their bus to make sure they catch it. Information updated by admins is live so students will not have to refresh to view new information.

Informational video for students: https://drive.google.com/file/d/1GNePsvjmeqIkuCKzadV3rCa1L38vnhKd/view?usp=sharing
--Pin System--
A new addition to the Bus App is the Pin system. This system allows students to "Pin" their buses. The student will only recieve notifications from pinned buses' status changes. Thus, this closely links with the Notification system, as otherwise it would be quite hectic if students got notifications for every single bus change that happened.

## Project Setup
Follow these steps to setup the Bus App project
1. Install node on your computer. Node download page: https://nodejs.org/en/download/. The current build is running on Node v17.4.0 (run `node --version` to verify). Functionality is unknown on other versions. Make sure you also have git on your computer.
2. Clone the git repository onto your computer using `git clone https://github.com/nnhsse202122/BusApp-SE2122.git`
3. Run `npm install` to install all dependencies

## Running the Bus App

#### On Local Host
To run the Bus App on local host, run `npm run start` using a terminal currently in the home directory of the project. This starts the server. After you see the message `Server is running on port 5182` you’ve started the server successfully. Now go to `http://localhost:5182/` to start development.

### On Dev Server
To run the Bus App on the development server, you need to ask Mr. Schmit to host the server, and after he gives you confirmation that it is up and running, it's exactly the same as the production server, but with a different domain name. Go to 'https://busappdev.nnhsse.org/' to start development. One thing to note is that the development server does not update until the server is rebuilt, so make sure everything you want to test is in a finished state.


#### Debugging
To debug the Bus App on your development system, run `npm run dev` using a terminal currently in the home directory of the project. Then choose the "Start Debugging" menu item in the "Run" menu. You can now set breakpoints in the javascript files.

### Production Server Deployment
1. Create a new EC2 instance used on Ubuntu.
2. Open ports for HTTP and HTTPS when walking through the EC2 wizard.
3. Generate a key pair for this EC2 instance. Download and save the private key, which is needed to connect to the instance in the future.
4. After the EC2 instance is running, click on the Connect button the EC2 Management Console for instructions on how to ssh into the instance.
5. On the EC2 instance, [install](https://github.com/nodesource/distributions/blob/master/README.md) Node.js v17

```
curl -fsSL https://deb.nodesource.com/setup_17.x | sudo -E bash -
sudo apt-get install -y nodejs
```

6. On the EC2 instance, install nginx: `sudo apt-get -y install nginx`
7. Create a reverse proxy for the Bus App node server. In the file /etc/nginx/sites-enabled/busApp:

```
server {
	# listen on port 80 (http)
	listen 80;
	server_name busapp.nnhsse.org;

	# write access and error logs to /var/log
	access_log /var/log/busapp_access.log;
	error_log /var/log/busapp_error.log;

	location / {
		# forward application requests to the node server
		proxy_pass http://localhost:5182;
		proxy_redirect off;
		proxy_set_header Host $host;
		proxy_set_header X-Real-IP $remote_addr;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
	}
}
```

8. Restart the nginx server: `sudo service nginx reload`
9. Install and configure [certbot](https://certbot.eff.org/lets-encrypt/ubuntufocal-nginx)
10. Clone this repository from GitHub.
11. Inside of the directory for this repository install the node dependencies: `npm install`
12. Update Google Cloud Platform is allow connections from new domain (busapp.nnhsse.org)
13. Install Production Manager 2, which is used to keep the node server running:

```
sudo npm install pm2 -g
sudo pm2 --name busapp start "npm run start"
```

14. Verify that the node server is running: `sudo pm2 list`
15. Configure pm2 to automatically run when the EC2 instance restarts: `sudo pm2 startup`
16. Add a crontab entry to pull from GitHub every 15 minutes: `crontab -e`

```
*/15 * * * * cd /home/ubuntu/BusApp-SE2122 && git pull
```

17. Restart the node server: `sudo pm2 restart index`

## Working with the Bus App

#### Overview of Web Applications
The Bus App is a web application built using Node. Specifically, the key dependency to managing a server is Express. Like all projects working with Express should, the entire project is started from the file `server.js`. In this file, all the setup for the project happens:
1. Setting the port number
2. Setting up Socket.io
3. Setting up Express to render the ejs file type and defining path shortcuts for assets
4. Linking all the routes (this is very important)
5. Starting some code that needs to be run periodically on a timer
6. Finally starting the server

A server is something that is always listening, and (with the exception of code run periodically) only runs code when a client makes a request to the server. The most common type of request (and only type used in the Bus App Project) is a get request. This is used for requesting the html (in our case ejs) required to display a page and occurs every time a url is typed into a search bar.

#### Technologies
The Bus App uses a variety of technologies. Below is some information on how to get started with them:

##### Express
As mentioned above, Express is the key technology we use to run a server. Please check the official documentation: https://expressjs.com/

##### Ejs
Ejs is a form of html that allows javascript to be run during the creation of the html. This allows for tables to be created much more easily. Please see the official documentation: https://ejs.co/

##### Socket.io
Socket.io allows us to send data to and from the server in live time using `emit()` and `on()`. This is important because it allows us to update a page without it being refreshed which is key to the functionality of the Bus App. Please see the official documentation: https://socket.io/

#### Review Checklist
To reduce errors on the main branch, we developed a review checklist that MUST be completed before pull requests into the main branch. This list should be updated as new features are added that need to be reviewed.

Bus App Review Checklist: https://docs.google.com/document/d/1LyFzvAMvRl7MwXduhM87Do7hioelJ-QnWEe4GnpKBU4/edit?usp=sharing

## Remaining User Stories (in product backlog)
Captured in Trello

## Folder Structure

server/ - the most important file

| - database/ - sets up the mongo server. I would not recommend messing with this file

| - - - connection.js

| - jsonHandler.js - useless and deprecated

| - model/ - contains all the mongo schema files

| - - - announcement.js - contains the code for the announcement schema

| - router.js - where 90% of stuff is. When the user goes to an endpoint (URL), it calls the function for the URL and runs the code

| - weatherController.js - where the weather data is stored

## Mongo

```
const Announcement = require("./model/announcement.js");

Announcement.findOneAndUpdate({}, {announcement: ""}, {upsert: true});
Announcement.findOneAndUpdate({}, {tvAnnouncement: ""}, {upsert: true});
```

this is how you import amongo schema. and using mongo methods on the imported schema allows you interact with the objects in the collection

```
(await Announcement.findOne({})).announcement
```

you can get information about the collection by calling the findOne function. inside the currently empty curly braces you can include filter intructions. 

NOTE: IT IS VERY IMPORTANT TO INCLUDE A PARENTHESES AROUND THE AWAIT ALL THE WAY UNTIL THE PERIOD. IF YOU DONT, EVERYTHING BREAKS.
