import { bootstrap } from './config/bootstrap.js';
import { env } from './config/env.js';
import { app } from './app.js';

function startServer(): void {
  app.listen(env.PORT, () => {
    console.log('ERP API running on http://localhost:' + env.PORT);
    void bootstrap();
  });
}

startServer();
