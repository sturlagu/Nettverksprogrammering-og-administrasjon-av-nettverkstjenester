package com.example.student.start;

import android.content.ContentResolver;
import android.content.Context;
import android.database.Cursor;
import android.provider.ContactsContract;
import android.util.Log;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import java.util.ArrayList;
public class MainActivity extends android.app.Activity{
    Context mContext;
    @Override
    public void onCreate(android.os.Bundle savedInstanceState){
        super.onCreate(savedInstanceState);
        WebView webView = new WebView(this);
        WebViewClient webViewClient = new WebViewClient();
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webView.addJavascriptInterface(webViewClient, "javaobjekt");
        webView.setWebViewClient(webViewClient);
        webView.loadUrl("file:///android_asset/index.html");
        setContentView(webView);
    }
    // Metode fra developer guide
    // When user clicks link, system calls"shouldOverrideURILoading
    private class MyWebViewClient extends WebViewClient{
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, String url) {
            view.loadUrl(url);
            return true;
        }
    }

    class WebViewClient extends android.webkit.WebViewClient{
        // Må være med for sdkVersion 17 eller høyere
        @android.webkit.JavascriptInterface
        // I denne metoden henter vi ut email og navn som går i en arraylist
        public String getUserData(String u) {
            ArrayList<String> names = new ArrayList<String>();
            ContentResolver contentResolver = getContentResolver();
            // Søker etter Kontaktliste URI's
            Cursor cur = contentResolver.query(ContactsContract.Contacts.CONTENT_URI, null, null, null, null);
            if (cur.getCount() > 0) {
                while (cur.moveToNext()) {
                    // Kontaktliste ID'er inn i string "id"
                    String id = cur.getString(cur.getColumnIndex(ContactsContract.Contacts._ID));
                    // Nytt søk - Søker etter email
                    Cursor cur1 = contentResolver.query(ContactsContract.CommonDataKinds.Email.CONTENT_URI, null,
                            ContactsContract.CommonDataKinds.Email.CONTACT_ID + " = ?", new String[]{id}, null);
                    while (cur1.moveToNext()) {
                        //Henter ut navn
                        String name = cur1.getString(cur1.getColumnIndex(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME));
                        Log.e("Name :", name);
                        // Henter ut email data
                        String email = cur1.getString(cur1.getColumnIndex(ContactsContract.CommonDataKinds.Email.DATA));
                        Log.e("Email", email);
                        // Legger det i arrayliste
                        if (email != null) {
                            names.add(email);
                            names.add(name);
                        }
                    }
                    cur1.close();
                }
            }

            String result = "";

            for (int i = 0; i < names.size(); i++) {
                if (names.get(i).equals(u)) {
                    result += names.get(i + 1);
                }
            }
            return result;
        }
    }

}
