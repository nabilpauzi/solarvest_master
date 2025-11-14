package com.solarvest_project;

import android.content.ContentValues;
import android.content.Context;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Log;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

public class FileSaveModule extends ReactContextBaseJavaModule {
    private static final String MODULE_NAME = "FileSaveModule";
    private ReactApplicationContext reactContext;

    public FileSaveModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return MODULE_NAME;
    }

    @ReactMethod
    public void saveFileToDownloads(String sourcePath, String fileName, Promise promise) {
        try {
            File sourceFile = new File(sourcePath);
            
            if (!sourceFile.exists()) {
                promise.reject("FILE_NOT_FOUND", "Source file does not exist: " + sourcePath);
                return;
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                // Android 10+ (API 29+) - Use MediaStore API
                saveFileUsingMediaStore(sourceFile, fileName, promise);
            } else {
                // Android 9 and below - Direct file access
                saveFileLegacy(sourceFile, fileName, promise);
            }
        } catch (Exception e) {
            Log.e(MODULE_NAME, "Error saving file to Downloads", e);
            promise.reject("SAVE_ERROR", "Failed to save file: " + e.getMessage(), e);
        }
    }

    private void saveFileUsingMediaStore(File sourceFile, String fileName, Promise promise) {
        try {
            ContentValues contentValues = new ContentValues();
            contentValues.put(MediaStore.Downloads.DISPLAY_NAME, fileName);
            contentValues.put(MediaStore.Downloads.MIME_TYPE, "application/vnd.openxmlformats-officedocument.presentationml.presentation");
            contentValues.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);

            Uri uri = reactContext.getContentResolver().insert(
                MediaStore.Downloads.EXTERNAL_CONTENT_URI,
                contentValues
            );

            if (uri == null) {
                promise.reject("INSERT_FAILED", "Failed to create file in Downloads");
                return;
            }

            // Copy file content
            try (InputStream inputStream = new FileInputStream(sourceFile);
                 OutputStream outputStream = reactContext.getContentResolver().openOutputStream(uri)) {
                
                if (outputStream == null) {
                    promise.reject("OUTPUT_STREAM_NULL", "Failed to open output stream");
                    return;
                }

                byte[] buffer = new byte[8192];
                int bytesRead;
                while ((bytesRead = inputStream.read(buffer)) != -1) {
                    outputStream.write(buffer, 0, bytesRead);
                }
                outputStream.flush();
            }

            promise.resolve(uri.toString());
            Log.d(MODULE_NAME, "File saved to Downloads: " + fileName);
        } catch (IOException e) {
            Log.e(MODULE_NAME, "Error copying file to Downloads", e);
            promise.reject("COPY_ERROR", "Failed to copy file: " + e.getMessage(), e);
        }
    }

    private void saveFileLegacy(File sourceFile, String fileName, Promise promise) {
        try {
            File downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
            if (!downloadsDir.exists()) {
                downloadsDir.mkdirs();
            }

            File destFile = new File(downloadsDir, fileName);
            
            // Copy file
            try (InputStream inputStream = new FileInputStream(sourceFile);
                 FileOutputStream outputStream = new FileOutputStream(destFile)) {
                
                byte[] buffer = new byte[8192];
                int bytesRead;
                while ((bytesRead = inputStream.read(buffer)) != -1) {
                    outputStream.write(buffer, 0, bytesRead);
                }
                outputStream.flush();
            }

            // Notify media scanner
            android.media.MediaScannerConnection.scanFile(
                reactContext,
                new String[]{destFile.getAbsolutePath()},
                null,
                null
            );

            promise.resolve(destFile.getAbsolutePath());
            Log.d(MODULE_NAME, "File saved to Downloads (legacy): " + destFile.getAbsolutePath());
        } catch (IOException e) {
            Log.e(MODULE_NAME, "Error copying file to Downloads (legacy)", e);
            promise.reject("COPY_ERROR", "Failed to copy file: " + e.getMessage(), e);
        }
    }
}


