# ioBroker DeyeCloud Adapter

[![NPM version](https://img.shields.io/npm/v/iobroker.deyecloud.svg)](https://www.npmjs.com/package/iobroker.deyecloud)
[![Tests](https://github.com/TheBam1990/ioBroker.deyecloud/actions/workflows/test-and-release.yml/badge.svg)](https://github.com/TheBam1990/ioBroker.deyecloud/actions/workflows/test-and-release.yml)

Connect ioBroker to the official DeyeCloud OpenAPI. The adapter discovers stations and their devices, reads the current cloud values at a configurable interval and creates matching ioBroker objects dynamically.

The first release is deliberately read-only. It never sends inverter control commands.

## Requirements

- ioBroker js-controller 6.0.11 or newer
- Node.js 22 or newer
- DeyeCloud account with an inverter or logger assigned
- DeyeCloud OpenAPI application with App ID and App Secret

## Getting an App ID and App Secret

1. Open the [official DeyeCloud Developer Portal](https://developer.deyecloud.com/).
2. Sign in with your DeyeCloud account or register a developer account.
3. Select the data center belonging to your DeyeCloud account. Europe is normally correct for Germany and other European countries.
4. Open **Applications** and choose **Create Application**.
5. Create an application, for example with the name `ioBroker`.
6. Copy the assigned **AppId** and **AppSecret** into the adapter configuration.

Treat the App Secret like a password. Do not publish it in screenshots, issues or log files.

## Configuration

| Setting | Description |
| --- | --- |
| Data center | Europe, Americas or India; it must match the account registration. |
| OpenAPI App ID | AppId of the application created in the developer portal. |
| OpenAPI App Secret | AppSecret of that application; stored encrypted by ioBroker. |
| Login type | Email, username or mobile number. |
| DeyeCloud account | The value matching the selected login type. |
| Country calling code | Required only for mobile login, without `+`, for example `49`. |
| DeyeCloud password | Password of the normal DeyeCloud account; stored encrypted by ioBroker. |
| Company ID | Optional for business members; leave empty for a personal account. |
| Polling interval | Cloud polling interval in seconds, minimum 60 seconds. |

## Objects

- `info.connection`: whether the last cloud request succeeded
- `info.lastUpdate`: time of the last successful update
- `info.lastError`: last authentication or API error
- `stations.<id>.info`: station metadata
- `stations.<id>.latest`: current station values
- `devices.<serial>.info`: device metadata
- `devices.<serial>.latest`: current device measurement values

The exact measurement points depend on the inverter model and the data returned by DeyeCloud. New fields are created automatically without deleting existing history.

## Troubleshooting

- Verify that the selected data center is the same one used by the DeyeCloud account.
- Verify AppId and AppSecret in the developer portal.
- Select the correct account login type.
- With mobile login, enter the calling code without a plus sign.
- DeyeCloud values may update more slowly than local inverter data because this adapter reads the cloud API.

## Changelog

### 0.1.0

- Initial read-only integration with official DeyeCloud OpenAPI authentication.
- Added station and device discovery with dynamic current-value objects.

## License

MIT License

Copyright (c) 2026 TheBam
