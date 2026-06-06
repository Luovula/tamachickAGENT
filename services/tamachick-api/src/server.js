import { createApp } from './app.js';
import { getConfig } from './config.js';

const config = getConfig();
const app = createApp({ config });

app.listen(config.port, () => {
  console.log(`tamachick-api listening on port ${config.port}`);
});
