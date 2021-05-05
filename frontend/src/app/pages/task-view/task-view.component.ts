import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Daily } from 'src/app/models/daily.model';
import { List } from 'src/app/models/list.mode';
import { Task } from 'src/app/models/task.model';
import { TaskService } from 'src/app/task.service';

@Component({
  selector: 'app-task-view',
  templateUrl: './task-view.component.html',
  styleUrls: ['./task-view.component.scss']
})
export class TaskViewComponent implements OnInit {

  lists: List[];
  tasks: Task[];
  dailys: Daily[];
  selectedListId: string;
  selectedDailyId: string;

  constructor(private taskService: TaskService, private route: ActivatedRoute, private router: Router) { }

  ngOnInit(): void {
    this.route.params.subscribe(
      (params: Params) => {
        if (params.dailyId){
          this.selectedDailyId = params.dailyId;
          this.taskService.getDailyTasks(params.dailyId).subscribe((tasks: Task[]) => {
            this.tasks = tasks;
          })
        } else if (params.listId) {
          this.selectedListId = params.listId;
          this.taskService.getTasks(params.listId).subscribe((tasks: Task[]) => {
            this.tasks = tasks;
          })
        } else {
          this.tasks = undefined;
        }
      }
    )

    this.taskService.getDailys().subscribe((dailys: Daily[]) => {
      this.dailys = dailys;
    })

    this.taskService.getLists().subscribe((lists: List[]) => {
      this.lists = lists;
    })

  }

 
  onTaskClick(task: Task) {
    // we want to complete task when its clicked
    this.taskService.complete(task).subscribe(() => {
      // The task has been set to completed!
      console.log("Completed Successfully!")
      task.completed = !task.completed;
    })
  }

  onTaskClickD(task: Task) {
        // we want to complete daily task when its clicked
        this.taskService.completeDaily(task).subscribe(() => {
          // The task has been set to completed!
          console.log("Completed Successfully!")
          task.completed = !task.completed;
        })
  }

  onClickDeleteList() {
    this.taskService.deleteList(this.selectedListId).subscribe((res: any) => {
      this.router.navigate(['/lists']);
      console.log(res);
    });
  }

  onClickDeleteTask(id: string) {
    this.taskService.deleteTask(this.selectedListId, id).subscribe((res: any) => {
      this.tasks = this.tasks.filter(val => val._id !== id);
      console.log(res);
    });
  }
}
