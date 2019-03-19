#include <stdio.h>
#include <netinet/in.h>     // IP
#include <unistd.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <dirent.h>
#include <limits.h>
#include "daemon.h"
#define LOKAL_PORT 80    // listen port 8080
#define QEUESIZE 10         // Størrelse på kø for ventende forespørsler 
FILE *fileExists();
void listDirectories();

int main (){
    // initierer variabler
    struct stat filestat;      
    struct sockaddr_in server_adress;
    int server_socket, client_socket, set_socket;
    // HTTP HEADERS
    char http_request[1024];
    char *http_bad_request = "HTTP/1.1 400 Bad Request\n\nFile not found!\n";
    char *http_not_supported = "HTTP/1.1 415 Unsupported Media Type\n\nFile type not supported!\n";  
    char *text_html = "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\n\r\n";
    char *plain_text = "HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\n";
    char *image_png = "HTTP/1.1 200 OK\r\nContent-Type: image/png\r\n\r\n";
    char *image_svg = "HTTP/1.1 200 OK\r\nContent-Type: image/svg+xml\r\n\r\n";
    char *application_xml = "HTTP/1.1 200 OK\r\nContent-Type: application/xml\r\n\r\n";
    char *application_xslt_xml = "HTTP/1.1 200 OK\r\nContent-Type: application/xslt+xml\r\n\r\n";
    char *text_css = "HTTP/1.1 200 OK\r\nContent-Type: text/css\r\n\r\n";
    char *application_javascript = "HTTP/1.1 200 OK\r\nContent-Type: application/javascript\r\n\r\n";
    char *application_json = "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n\r\n";
    char *image;
    char http_response[BUFSIZ]; // Max size for response (BUFSIZ = 512 char, 4096 bytes)
    char *file_path, *file_type;
    char *rootfile = "index.html";
    char cwd[PATH_MAX];
    FILE *file_pointer;
    FILE *error;
    //åpner error.log fil
    error = fopen("/var/log/webtjener/error.log", "a");
    //Redigerer stderr til error fil
    dup2(fileno(error), STDERR_FILENO);
    fclose(error);

    // Sett ny root mappe og current directory
    chroot("/var/www/");   
    // Setter opp socket-strukturen for serveren 
    server_socket = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP); //(IPv4, connection-based, TCP)
    if(server_socket < 0){
        perror("Making server socket failed\n");
    }
    // For at operativsystemet ikke skal holde porten reservert etter tjenerens død
    set_socket = setsockopt(server_socket, SOL_SOCKET, SO_REUSEADDR, &(int){ 1 }, sizeof(int)); //(socket, socket-level, enable, sizeof(enable))
    if(set_socket < 0){
        perror("Setting server socket failed\n");
    }
    // Initierer server adresse
    server_adress.sin_family      = AF_INET;                    // IPv4
    server_adress.sin_port        = htons((u_short)LOKAL_PORT); // Port
    server_adress.sin_addr.s_addr = htonl(INADDR_ANY);          // All local network interfaces
    // Kobler sammen socket og server adresse
    if (bind(server_socket, (struct sockaddr *)&server_adress, sizeof(server_adress)) == 0){//Bind adress to socket
        fprintf(stdout, "Prosess %d er knyttet til port %d.\n", getpid(), LOKAL_PORT);
        fflush(stdout);
    }
    else{
        perror("Binding server socket failed\n");
        exit(2);
    }
    // Daemonisering fra daemon.h
    sessdetach();
    // Droppe root tilgangen fra daemon.h
    drop_root_privileges();
    // Venter på forespørsel om forbindelse med maks antall ventende forespølser
    listen(server_socket, QEUESIZE);
    while(1){ 
        // Aksepterer mottatt forespørsel
        client_socket = accept(server_socket, NULL, NULL);
        if(set_socket < 0){
            perror("Accepting client socket failed\n");
        }    
        recv(client_socket, http_request, sizeof(http_request), 0);               
        //Oppretter barneprosess
        if(fork() == 0) {    
            dup2(client_socket, 1);          // Rediger klient-socket til stdout
            strtok(http_request, " ");      // Kutter første ord "GET", men filen er fortsatt åpen.. 
            file_path = strtok(NULL, " ");  // Så henter vi ut "GET-requesten"

            //Finner filendelse først
            file_type = strchr(file_path, '.');
            if (file_type != NULL){             
                // Ser på hva som er etter "."
                file_type++;
                strcpy(file_type, file_type);
                // Her velges header ut ifra filtype             
                // text/html
                if (strcmp(file_type, "html") == 0 || strcmp(file_type, "htm") == 0 || strcmp(file_type, "shtml") == 0) {
                    //Sjekker om fil eksister
                    file_pointer = fileExists(file_path, "r", client_socket); 
                    // Hvis fil eksister send HEADER
                    if(file_pointer != NULL){
                        send(client_socket, text_html, strlen(text_html), 0);
                        // Her blir filinnholdet sendt        
                        while (fgets(http_response, BUFSIZ, file_pointer) != NULL) {
                            send(client_socket, http_response, strlen(http_response), 0);
                        }
                    }                   
                } 
                // text/plain
                else if (strcmp(file_type, "asc") == 0 || strcmp(file_type, "txt") == 0 || strcmp(file_type, "text") == 0 || strcmp(file_type, "pot") == 0 || strcmp(file_type, "brf") == 0 || strcmp(file_type, "srt") == 0 || strcmp(file_type, "log") == 0 || strcmp(file_type, "asis") == 0){
                    file_pointer = fileExists(file_path, "r", client_socket); 
                    if(file_pointer != NULL){
                        send(client_socket, text_html, strlen(text_html), 0);
                         while (fgets(http_response, BUFSIZ, file_pointer) != NULL) {
                            send(client_socket, http_response, strlen(http_response), 0);
                        }
                    }
                }
                // image/png
                else if (strcmp(file_type, "png") == 0){
                    file_pointer = fileExists(file_path, "rb", client_socket);
                    if(file_pointer != NULL){
                        send(client_socket, image_png, strlen(image_png), 0);
                        // fstat() brukes for å finne størrelse på bilde
                        fstat(fileno(file_pointer), &filestat);
                        // Setter av størrelse for å sende bilde
                        image = (char *)malloc((filestat.st_size+1)*1);
                        fread(image, 1, filestat.st_size, file_pointer);
                        send(client_socket, image, filestat.st_size, 0);        
                    }

                }
                // image/svg
                else if (strcmp(file_type, "svg") == 0 || strcmp(file_type, "svgz") == 0){
                    file_pointer = fileExists(file_path, "rb", client_socket);
                    if(file_pointer != NULL){
                        send(client_socket, image_svg, strlen(image_svg), 0);
                        fstat(fileno(file_pointer), &filestat);
                        image = (char *)malloc((filestat.st_size+1)*1);
                        fread(image, 1, filestat.st_size, file_pointer);
                        send(client_socket, image, filestat.st_size, 0);  
                    }
                }
                // application/xml
                else if (strcmp(file_type, "xml") == 0 || strcmp(file_type, "xsd") == 0){
                    file_pointer = fileExists(file_path, "r", client_socket); 
                    if(file_pointer != NULL){
                        send(client_socket, application_xml, strlen(application_xml), 0);
                         while (fgets(http_response, BUFSIZ, file_pointer) != NULL) {
                            send(client_socket, http_response, strlen(http_response), 0);
                        }
                    }
                }
                // application/xslt+xml
                else if (strcmp(file_type, "xsl") == 0 || strcmp(file_type, "xslt") == 0){
                    file_pointer = fileExists(file_path, "r", client_socket); 
                    if(file_pointer != NULL){
                        send(client_socket, application_xslt_xml, strlen(application_xslt_xml), 0);
                         while (fgets(http_response, BUFSIZ, file_pointer) != NULL) {
                            send(client_socket, http_response, strlen(http_response), 0);
                        }
                    }
                }
                // text/css
                else if (strcmp(file_type, "css") == 0){
                    file_pointer = fileExists(file_path, "r", client_socket); 
                    if(file_pointer != NULL){
                        send(client_socket, text_css, strlen(text_css), 0);
                         while (fgets(http_response, BUFSIZ, file_pointer) != NULL) {
                            send(client_socket, http_response, strlen(http_response), 0);
                        }
                        
                    }
                }
                // application/javascript
                else if (strcmp(file_type, "js") == 0){
                    file_pointer = fileExists(file_path, "r", client_socket); 
                    if(file_pointer != NULL){
                        send(client_socket, application_javascript, strlen(application_javascript), 0);
                         while (fgets(http_response, BUFSIZ, file_pointer) != NULL) {
                            send(client_socket, http_response, strlen(http_response), 0);
                        }
                    }
                }
                // application/json
                else if (strcmp(file_type, "json") == 0){
                    file_pointer = fileExists(file_path, "r", client_socket); 
                    if(file_pointer != NULL){
                        send(client_socket, application_json, strlen(application_json), 0);
                         while (fgets(http_response, BUFSIZ, file_pointer) != NULL) {
                            send(client_socket, http_response, strlen(http_response), 0);
                        }
                    }
                }
                else{
                    // filetype not supported
                    send(client_socket, http_not_supported, strlen(http_not_supported), 0);
                    // Logger feilmelding
                    fprintf(stderr, "%s - Filtypen støttes ikke\n", file_path);     
                }
            }
            else{
                // root katalog (/)
                file_type = strchr(file_path, '/');
                if (file_type != NULL){
                    file_pointer = fileExists(rootfile, "r", client_socket); 
                    if(file_pointer != NULL){
                        // HEADER
                        send(client_socket, text_html, strlen(text_html), 0);
                        // Index.html for root index
                        while (fgets(http_response, BUFSIZ, file_pointer) != NULL) {
                            send(client_socket, http_response, strlen(http_response), 0);
                        }
                    }
                    // Get current directory absolute path
                    if(getcwd(cwd, sizeof(cwd)) != NULL) {
                        listDirectories(cwd);
                    }
                    else{
                        perror("getcwd() error");
                    }    
                    
                } 
                //send(client_socket, http_bad_request, strlen(http_bad_request), 0);
                //perror("No file type-ending\n");
            }
            fclose(file_pointer);
            fflush(stdout);
            // Sørger for å stenge socket for skriving og lesing
            // NB! Frigjør ingen plass i fildeskriptortabellen
            shutdown(client_socket, SHUT_RDWR);
            exit(0);
        }
        else {
            close(client_socket);
        }
    }
    return 0;
}

// Sjekker om filen eksister
FILE *fileExists(char *file_path, char *readMode, int client_socket){
    char *http_bad_request = "HTTP/1.1 400 Bad Request\n\nFile not found!\n";
    FILE *file_pointer;
    file_pointer = fopen(file_path, readMode);
    if(file_pointer == NULL){
        send(client_socket, http_bad_request, strlen(http_bad_request), 0);
    }
    else{
        return file_pointer;
    }
    return file_pointer;
}
// Kataloglisting
void listDirectories(char *file_path){
    struct stat stat_buffer;
    struct dirent *ent;
    DIR *dir;

    if ((dir = opendir (file_path)) == NULL) {
        perror ("cant open dirr"); 
        exit(1); 
    }

    chdir(file_path);

    printf("<br>Katalogen %s:<br>", file_path);
    printf("------------------------------------<br>");         
    printf("Rettigheter\tUID\tGID\tNavn<br>");
    printf("------------------------------------<br>");         

    while ((ent = readdir (dir)) != NULL) {
        if (stat(ent->d_name, &stat_buffer) < 0) {
            perror("stat error! in listdirectories()"); 
            exit(1); 
        }
        if(strcmp(ent->d_name, ".") == 0 || strcmp(ent->d_name, "..") == 0){
            continue;
        }
        printf("%o\t\t", stat_buffer.st_mode & 0777 );      
        printf("%d\t",   stat_buffer.st_uid);
        printf("%d\t",   stat_buffer.st_gid);
        printf("<a href=%s>%s</a><br>", realpath(ent->d_name, file_path), ent->d_name); 
    }
    // HTML document end
    printf("</body>\n</html>");
    closedir (dir);
}
