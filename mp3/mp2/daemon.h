#include <signal.h>
#include <stdio.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/stat.h>

#ifdef BSD
	#include <sys/file.h>
	#include <sys/ioctl.h>
#endif

void sessdetach(){
	// Call fork(), to create a background process.
	if(fork()){ 
		// for at dockercontainer skal holde seg i live
		raise(SIGSTOP);
		exit(0); // Kill parent
	}
	// In the child, call setsid() to detach from any terminal and create an independent session.
	setsid(); 

	// Child ignores signals
	signal(SIGTTOU, SIG_IGN); 
	signal(SIGTTIN, SIG_IGN);
	signal(SIGTSTP, SIG_IGN);
	signal(SIGCHLD, SIG_IGN);

	//In the child, call fork() again, to ensure that the daemon can never re-acquire a terminal again.
	if(fork()){
		//Call exit() in the first child, so that only the second child (the actual daemon process) stays around.
		exit(0); 
	}

	// Change the working directory to the root directory
	chdir("/");
	// Sett new file permissions
	umask(0);
	// Closing stdin because we dont need it
	close(0);
	return;
}

// Funksjon for å droppe root rettigheter
void drop_root_privileges() {
    // IF root
	if (getuid() == 0){
		// Prøver å sette groupID
		if (setgid(1000) != 0){
			perror("setgid: Unable to drop group privileges");
		}
		// Prøver å sette userID
		if (setuid(1000) != 0){
			perror("setgid: Unable to drop user privileges");
		}
	}
    else{
        fprintf(stderr, "You are already NOT root");
	}
}