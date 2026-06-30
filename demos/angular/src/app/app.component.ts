import { Component } from '@angular/core';
import { gql } from '@dumbql/client';
import { DumbqlQueryDirective } from '@dumbql/core';

const GET_NOTES = gql`
  query {
    getNotes {
      id
      title
      content
    }
  }
`;

interface Note {
  id: string;
  title: string;
  content: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DumbqlQueryDirective],
  template: `
    <h1>DumbQL + Angular</h1>

    <ng-template dumbqlQuery [query]="GET_NOTES" let-data let-loading="loading" let-error="error">
      @if (loading) { <p>Loading...</p> }
      @if (error)  { <p>Error: {{ error }}</p> }
      @if (data) {
        <ul>
          @for (note of data.getNotes; track note.id) {
            <li><strong>{{ note.title }}</strong>: {{ note.content }}</li>
          }
        </ul>
      }
    </ng-template>
  `,
})
export class AppComponent {
  readonly GET_NOTES = GET_NOTES;
}
