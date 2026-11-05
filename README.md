# mock-interview-ai-assistant-tool
An AI initiative tool to help practice answering technical interviews


## 1. Backend
From the project folder, run in PowerShell:

```powershell
cd server
npm install
Copy-Item .env.example .env
```

Edit `server/.env` and replace `your_gemini_api_key_here` with your own Gemini API key.
Do not share or commit this file. If `.env` already exists, edit it instead of copying over it.

```powershell
npm run dev # http://localhost:3000
```

The server loads `server/.env` regardless of the launch directory. Existing environment
variables take precedence. Restart the server after changing `.env`.
Without a valid key, question-bank operations still work, but AI generation,
evaluation, and reports do not.

Free key: https://aistudio.google.com/apikey (no billing needed).
Confirm the model name in AI Studio and set GEMINI_MODEL if needed.

## 2. Frontend
npx -p @angular/cli ng new interview-ai-client --style=css --routing --ssr=false
Then copy client/src/main.ts, client/src/styles.css and client/src/app/* over the generated files,
and copy client/proxy.conf.json to the project root.
cd interview-ai-client && ng serve --proxy-config proxy.conf.json    # http://localhost:4200

Audio mode uses the browser Web S


RUN
cd /server
```powershell
npm run dev 
# http://localhost:3000
```
cd /client
```powershell
ng serve --proxy-config proxy.conf.json    
# http://localhost:4200
```
