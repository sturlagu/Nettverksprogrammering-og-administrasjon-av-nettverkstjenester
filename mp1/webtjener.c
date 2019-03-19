#include <stdio.h>
#include <netinet/in.h>     // IP
#include <unistd.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <sys/stat.h>
#include "daemon.h"
#define LOKAL_PORT 80    // listen port 8080
#define QEUESIZE 10         // Størrelse på kø for ventende forespørsler 
int main (){
    // initierer variabler      
    struct sockaddr_in server_adress;
    int server_socket, client_socket, set_socket;
    char http_request[1024];
    char *http_bad_request = "HTTP/1.1 400 Bad Request\n\nFile not found!\n";    
    char http_response[BUFSIZ]; // Max size for response (BUFSIZ = 512 char, 4096 bytes)
    char *file_path;
    FILE *file_pointer;
    FILE *error;
    // Sett ny root mappe
    chroot("/var/www/");
    //åpner error.log fil
    error = fopen("error.log", "a");
    //Redigerer stderr til error fil
    dup2(fileno(error), STDERR_FILENO);
    // lukker åpen fil
    fclose(error);
    // Setter opp socket-strukturen for serveren 
    server_socket = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP); //(IPv4, connection-based, TCP)
    if(server_socket < 0){
        perror("Making server socket failed");
    }
    // For at operativsystemet ikke skal holde porten reservert etter tjenerens død
    set_socket = setsockopt(server_socket, SOL_SOCKET, SO_REUSEADDR, &(int){ 1 }, sizeof(int)); //(socket, socket-level, enable, sizeof(enable))
    if(set_socket < 0){
        perror("Setting server socket failed");
    }
    // Initierer server adresse
    server_adress.sin_family      = AF_INET;                    // IPv4
    server_adress.sin_port        = htons((u_short)LOKAL_PORT); // Port
    server_adress.sin_addr.s_addr = htonl(INADDR_ANY);          // All local network interfaces
    // Kobler sammen socket og server adresse
    if (bind(server_socket, (struct sockaddr *)&server_adress, sizeof(server_adress)) == 0){//Bind adress to socket
        fprintf(stderr, "Prosess %d er knyttet til port %d.\n", getpid(), LOKAL_PORT);
        fflush(stdout);
    }
    else{
        perror("Binding server socket failed");
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
            perror("Accepting client socket failed");
        }    
        recv(client_socket, http_request, sizeof(http_request), 0);               
        //Oppretter barneprosess
        if(fork() == 0) {          
            dup2(client_socket, 1);          // Rediger klient-socket til stdout
            strtok(http_request, " ");      // Kutter første ord "GET", men filen er fortsatt åpen.. 
            file_path = strtok(NULL, " ");  // Så henter vi ut "GET-requesten"
            file_pointer = fopen(file_path, "r"); // åpner forespurt fil med read only 
            // Sjekk om fil eksisterer
            if(file_pointer == 0){
                //Sender feilmelding
                send(client_socket, http_bad_request, strlen(http_bad_request), 0);
                // Logger feilmelding
                fprintf(stderr, "%s - filen finnes ikke", file_path);       
            }
            while (fgets(http_response, BUFSIZ, file_pointer) != NULL) {
				send(client_socket, http_response, strlen(http_response), 0);
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

