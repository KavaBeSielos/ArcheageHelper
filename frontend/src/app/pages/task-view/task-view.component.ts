import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
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
  selectedListId: string;

  constructor(private taskService: TaskService, private route: ActivatedRoute, private router: Router) { }

  ngOnInit(): void {
    this.route.params.subscribe(
      (params: Params) => {
        this.taskService.getTasks(params.listId).subscribe((tasks: Task[]) => {
          this.tasks = tasks;
        })
      }
    )

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

}
