import 'dotenv/config'
import express from 'express'
import bodyParser from 'body-parser';
import getUserRoutes from './Routes/userRouter';
import getProductRoutes from './Routes/productRouter';
import initializeDBConnection from './Config/db';

const app = express();
const PORT = process.env.PORT || 9000

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const router = express.Router();

app.use('/user', getUserRoutes(router));
app.use('/product', getProductRoutes(router));

app.get("/jobs", async(req, res) => {
});

app.get("/getjob", async(req, res) => {
});

app.listen(PORT, async() => {
  try {
    await initializeDBConnection()
    console.log(`Node server started ${PORT}`);
    } catch( err) {
    console.error(err)
    }
});