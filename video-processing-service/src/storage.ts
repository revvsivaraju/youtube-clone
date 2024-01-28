import { Storage } from "@google-cloud/storage";
import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import { resolve } from "path";

const storage = new Storage(); //creating a new instance of the Storage class

const rawVideoBucketName = "revanth-yt-raw-videos"; //bucket names are unique across all of Google Cloud Storage globally
const processedVideoBucketName = "revanth-yt-processed-videos";

const localRawVideoFilePath = "./raw";
const localProcessedVideoFilePath = ".processed";

export function setupDirectories() {
    ensureDirectoryExistence(localRawVideoFilePath);
    ensureDirectoryExistence(localProcessedVideoFilePath);
  }


export function videoconversion(rawVideoName: string, processedVideoName: string){

    return new Promise<void>((resolve, reject) => {
        ffmpeg(`${localRawVideoFilePath}/${rawVideoName}`)
        .outputOptions('-vf', 'scale=-1:360') // 360p
        .on('end', function() {
            console.log('Processing finished successfully');
            //res.status(200).send('Processing finished successfully');
            resolve();
        })
        .on('error', function(err: any) {
            console.log('An error occurred: ' + err.message);
            //res.status(500).send('An error occurred: ' + err.message);
            reject(err);
        })
        .save(`${localProcessedVideoFilePath}/${processedVideoName}`);
    });         
}


export async function donwloadRawVideo(filename: string){
    await storage.bucket(rawVideoBucketName).file(filename).download({destination:`${localRawVideoFilePath}/${filename}`});
    console.log(`gs://${rawVideoBucketName}/${filename} downloaded to ${localRawVideoFilePath}/${filename}.`);
}
    
export async function uploadProcessedVideo(filename:string){
    
    const processedVideoBucket = storage.bucket(processedVideoBucketName);
    await processedVideoBucket.upload(`${localProcessedVideoFilePath}/${filename}`, {destination: filename});
    console.log(`${localProcessedVideoFilePath}/${filename} uploaded to gs://${processedVideoBucketName}/${filename}.`);
    await processedVideoBucket.file(filename).makePublic();

}
export function deleteRawVideo(fileName: string) {
    return deleteLocalFiles(`${localRawVideoFilePath}/${fileName}`);
  }

export function deleteProcessedVideo(fileName: string) {
    return deleteLocalFiles(`${localProcessedVideoFilePath}/${fileName}`);
  }


function deleteLocalFiles(filePath:string): Promise<void>{

    return new Promise((resolve, reject) => {
        if (fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) => {
              if (err) {
                console.error(`Failed to delete file at ${filePath}`, err);
                reject(err);
              } else {
                console.log(`File deleted at ${filePath}`);
                resolve();
              }
            });
          } else {
            console.log(`File not found at ${filePath}, skipping delete.`);
            resolve();
          }
    })
}


function ensureDirectoryExistence(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true }); // recursive: true enables creating nested directories
    console.log(`Directory created at ${dirPath}`);
  }
}