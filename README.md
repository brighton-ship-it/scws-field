# SCWS Field Service

Field service management app for Southern California Well Service.

## Features
- 📊 Dashboard with daily schedule
- 👥 Customer management with well info
- 📋 Job scheduling & tracking
- 💰 Invoice generation
- 📱 iOS & Android native apps

## Development

### Run locally
```bash
npm install
node server.js
# Open http://localhost:3000
```

### Build for iOS
```bash
npx cap sync ios
npx cap open ios
# Build in Xcode
```

### Build for Android
```bash
npx cap sync android
npx cap open android
# Build in Android Studio
```

## App Store Submission Checklist

### iOS (Apple App Store)
1. **Apple Developer Account** - $99/year at developer.apple.com
2. **App Icon** - 1024x1024 PNG (no transparency)
3. **Screenshots** - 6.5" and 5.5" iPhone sizes
4. **Privacy Policy** - Required URL
5. **App Description** - For App Store listing

### Android (Google Play)
1. **Google Play Developer** - $25 one-time at play.google.com/console
2. **App Icon** - 512x512 PNG
3. **Feature Graphic** - 1024x500 PNG
4. **Screenshots** - Phone and tablet sizes
5. **Privacy Policy** - Required URL

## Project Structure
```
scws-app-v2/
├── public/           # Web app files
│   ├── index.html
│   ├── style.css
│   └── app.js
├── ios/              # Xcode project
├── android/          # Android Studio project
├── server.js         # API server
├── db.json           # Database file
└── capacitor.config.json
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/dashboard | Today's jobs + stats |
| GET/POST | /api/customers | List/create customers |
| GET/PUT/DELETE | /api/customers/:id | Manage customer |
| GET/POST | /api/jobs | List/create jobs |
| GET/PUT/DELETE | /api/jobs/:id | Manage job |
| GET/POST | /api/invoices | List/create invoices |
| GET/PUT | /api/settings | App settings |
