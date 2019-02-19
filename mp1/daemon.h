#include <signal.h>
#include <stdio.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/stat.h>

#ifdef BSD
	#include <sys/file.h>
	#include <sys/ioctl.h>
#endif

int sessdetach(){
	if(fork()){
		raise(SIGSTOP);
		exit(0); //parent dies
	}
	setsid(); // Create session, free from tty
	signal(SIGTTOU, SIG_IGN); //
	signal(SIGTTIN, SIG_IGN);
	signal(SIGTSTP, SIG_IGN);
	signal(SIGCHLD, SIG_IGN);

	chdir("/");
	umask(0);

	if(fork()){
		exit(0); //sessionleader dies, cannot obtain tty
	}
	close(0);
	return 0;
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