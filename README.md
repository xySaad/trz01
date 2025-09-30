since reCaptcha has been added, a new verion of this script is available in `recaptcha` branch
# trz01

automate zone01 transport booking

### Setup

```bash
git clone https://github.com/xySaad/trz01
```

```bash
npm install
```

#### Then modify the config.json

Example:

```json
{
  "username": "srm",
  "schedule": [
    {
      "runOn": "12:00",
      "busTime": "19:40",
      "depart": "Campus",
      "destination": "Bab El Gharbi"
    },
    {
      "runOn": "16:00",
      "busTime": "08:00",
      "depart": "Bab El Gharbi",
      "destination": "Campus"
    }
  ]
}
```

### Usage

```bash
npm start
```

```bash
Enter your password: (your password here)
```
