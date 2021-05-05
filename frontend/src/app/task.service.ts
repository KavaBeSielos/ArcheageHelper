import { Injectable } from '@angular/core';
import { Task } from './models/task.model';
import { WebRequestService } from './web-request.service';

@Injectable({
  providedIn: 'root'
})
export class TaskService {

  constructor(private webReqService: WebRequestService) { }

  createList(title: string) {
    //we want to send a web request to create a list
    return this.webReqService.post('lists', { title });
  }

  updateList(id: string, title: string) {
    //we want to send a web request to update a list
    return this.webReqService.patch(`lists/${id}`, { title });
  }

  updateTask(listId: string, taskId: string, title: string) {
    //we want to send a web request to update a task
    return this.webReqService.patch(`lists/${listId}/tasks/${taskId}`, { title });
  }

  getDailys() {
    return this.webReqService.get('dailys');
  }

  getLists() {
    return this.webReqService.get('lists');
  }

  deleteList(id: string) {
    return this.webReqService.delete(`lists/${id}`);
  }

  getTasks(listId: string) {
    return this.webReqService.get(`lists/${listId}/tasks`);
  }

  getDailyTasks(dailyId: string) {
    return this.webReqService.get(`dailys/${dailyId}/tasks`);
  }

  deleteTask(listId: string, taskId: string) {
    return this.webReqService.delete(`lists/${listId}/tasks/${taskId}`);
  }
  
  createTask(title: string, listId: string) {
    //we want to send a web request to create a task
    return this.webReqService.post(`lists/${listId}/tasks`, { title });
  }

  complete(task: Task) {
    return this.webReqService.patch(`lists/${task._listId}/tasks/${task._id}`, {
      completed: !task.completed
    })
  }

  completeDaily(task: Task) {
    return this.webReqService.patch(`dailys/${task._listId}/tasks/${task._id}`, {
      completed: !task.completed
    })
  }
  

  
}
