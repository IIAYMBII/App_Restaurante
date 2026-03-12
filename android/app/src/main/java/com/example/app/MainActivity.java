package com.example.app;

import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;
import android.os.Bundle;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebSettings settings = getBridge().getWebView().getSettings();

        // Habilitar JavaScript
        settings.setJavaScriptEnabled(true);

        // ✅ ESTAS DOS LÍNEAS son las que habilitan Web Bluetooth dentro del WebView
        settings.setDatabaseEnabled(true);
        settings.setDomStorageEnabled(true);

        getBridge().getWebView().setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(PermissionRequest request) {
                // Acepta TODOS los permisos que el WebView solicite
                // incluyendo bluetooth, cámara, micrófono, etc.
                request.grant(request.getResources());
            }
        });
    }
}