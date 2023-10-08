# WhatsApp Contact Sync

<p align="center">
    <img src="web/public/logo.png" alt="logo" width="150"/>
</p>

<p align="center">
    <a href="https://www.buymeacoffee.com/guyzyl">
        <img
            src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
            alt="Buy Me A Coffee"
            width="220px"
        />
    </a>
</p>

A simple web app for syncing the profile pictures from WhatsApp to Google Contacts.\
The app matches contacts based on their phone numbers, and utilizes
[whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js) and [Google People API](https://developers.google.com/people) to update the profile picture in Google Contacts.

## Demo

<p align="center">
    <img src="https://user-images.githubusercontent.com/3015856/214192748-1681d9be-201a-4ffc-b8da-79857718b7eb.gif" width="600"/>
</p>

## Why Was This Developed?

Whenever someone used to call me or I looked them up in my contacts, they all apear as colorful circles with a single letter in it.\
The annoying part is that every single person I know has a WhatsApp account which has a profile picture. They are both based on the same phone number but the picture is only available in one of them.\
In order to fix this grievence I developed this app which allows anyone to sync their contacts photos from WhatsApp to Google Contacts.

## How To Use

The app is extremley easy to use (and self explantory):

1. Go to [whasync.com](https://whasync.com/)
2. Press "Get Started"
3. Scan the QR code with WhatsApp to authorize it
4. Connect you Google account
5. Choose you sync options
6. That's it :)

The whole process is very simple and automated, so you don't need to worry about anything else.\
Setting up should take less then a minute, and syncing should take about 1 second per photo (due to Google's API rate limitiations of 60 requests per user per minute)

## How to Run Locally

In order for the backend to function, it requires an OAuth client id and secret + an API key.\
Since (for obvious reasons) this is a private app, you will need to create one for your own.\
You can see instructions on how to do that [here](https://developers.google.com/workspace/guides/create-credentials).\
Once you do that, create the file `server/.env`, and set the following environment variables:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

You also need to update the `CLIENT_ID` and `API_KEY` variables in [`web/src/pages/GoogleAuth.vue`](web/src/pages/GoogleAuth.vue).

Once that's done, you can go ahead and run the app:

```bash
# Run backend
cd server
npm install
npm run dev

# Run web app
cd web
npm install
npm run dev
```

## Build Docker Images

There are 3 different `Dockerfile`s for this app:

- [`Dockerfile`](Dockerfile) - This is an image containing both the backend and the web app
- [`Dockerfile`](web/Dockerfile) - An image containing only the web app
- [`Dockerfile`](server/Dockerfile) - An image containing only the backend

In order to build and run the complete app, you need to run the following commands:

```bash
docker build -t whasync .
docker run --rm -it -p 80:80 whasync
```

In order to build the seperate images for the backend and frontend, execute the following commands from the projects main directory:

```bash
docker build -t whasync-backend -f server/Dockerfile .
docker build -t whasync-web -f web/Dockerfile .
```
