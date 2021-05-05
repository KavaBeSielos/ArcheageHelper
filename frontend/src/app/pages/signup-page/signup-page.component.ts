import { HttpResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/auth.service';
import { Daily } from 'src/app/models/daily.model';
import { List } from 'src/app/models/list.mode';
import { Task } from 'src/app/models/task.model';
import { TaskService } from 'src/app/task.service';

@Component({
  selector: 'app-signup-page',
  templateUrl: './signup-page.component.html',
  styleUrls: ['./signup-page.component.scss']
})
export class SignupPageComponent implements OnInit {

  constructor(private authService: AuthService, private router: Router, private taskService: TaskService) { }

  selectedDailyId: string;

  ngOnInit(): void {
  }

  onSignupButtonClicked(email: string, password: string) {
    this.authService.Signup(email,password).subscribe((res: HttpResponse<any>) => {
      this.taskService.getDailys().subscribe((daily: Daily[]) => {
        daily.forEach ((daily) => {
          this.taskService.createList(daily.title).subscribe((list: List) => {
            //console.log(list._id);
            this.taskService.getDailyTasks(daily._id).subscribe((task: Task[]) => {
              //console.log(task);
              task.forEach( (task) => {
                //console.log(task.title ,list._id);
                this.taskService.createTask(task.title, list._id).subscribe((newTask: Task) => {
                });
              });
            });
          });
        });
      })
      this.router.navigate(['/lists']);
    });
  }


  
}
