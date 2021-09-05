const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const _ = require('lodash');
const {Storage} = require('@google-cloud/storage')
const path = require('path')

const app = express();

//gcs
const gcs = new Storage({
    keyFilename: path.join(__dirname,'file-upload-system-7adacef1dfb9.json'),
    projectId: 'file-upload-system'
})

const fus_bucket_file = gcs.bucket('fus_bucket')
// enable files upload
app.use(fileUpload({
    createParentPath: true,
    limits: { 
        fileSize: 2 * 1024 * 1024 * 1024 //2MB max file(s) size
    },
}));

//add other middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('dev'));

//homepage
app.get('/',async(req,res) => {
    try {
        res.status(200).send({
            message: 'Hello World'
        });
    } catch(err) {
        res.status(500).send(err);
    }
})

// upoad single file
app.post('/uploadfile', async (req, res) => {
    try {
        if(!req.files) {
            res.send({
                status: false,
                message: 'No file uploaded'
            });
        } else {
            //Use the name of the input field (i.e. "tf") to retrieve the uploaded file
            let tf = req.files.tf;
            
            //Use the mv() method to place the file in upload directory (i.e. "uploads")
            // tf.mv('./uploads/' + tf.name);
            fus_bucket_file.file(tf).createWriteStream({
                resumable: false,
                gzip: true
            })

            //send response
            res.send({
                status: true,
                message: 'File is uploaded',
                data: {
                    name: tf.name,
                    mimetype: tf.mimetype,
                    size: tf.size
                }
            });
        }
    } catch (err) {
        res.status(500).send(err);
    }
})

//make uploads directory static
app.use(express.static('uploads'))

//start app 
const port = process.env.PORT || 3000;

app.listen(port, () => 
  console.log(`App is listening on port ${port}.`)
);