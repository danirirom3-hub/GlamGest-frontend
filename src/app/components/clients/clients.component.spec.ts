/// <reference types="jasmine" />

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ClientsComponent } from './clients.component';
import { ClientsService } from '../../services/clients.service';
import { provideTranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';

describe('ClientsComponent', () => {
  let component: ClientsComponent;
  let fixture: ComponentFixture<ClientsComponent>;
  let clientsServiceSpy: jasmine.SpyObj<ClientsService>;

  const mockClientsList = [
    { id: 1, name: 'Daniela Rincon', email: 'daniela@mail.com', phone: '123456789' },
    { id: 2, name: 'Angie Sosa', email: 'angie@mail.com', phone: '987654321' }
  ];

  const mockPage = () => ({
    data: {
      items: [...mockClientsList],
      page: 0,
      size: 25,
      totalItems: 2,
      totalPages: 1
    },
    status: 200,
    successful: true,
    message: 'OK'
  });

  beforeEach(async () => {
    clientsServiceSpy = jasmine.createSpyObj('ClientsService', [
      'getClients',
      'createClient',
      'updateClient',
      'deleteClient'
    ]);

    clientsServiceSpy.getClients.and.returnValue(of(mockPage()) as any);

    await TestBed.configureTestingModule({
      imports: [ClientsComponent],
      providers: [
        provideTranslateService(),
        { provide: ClientsService, useValue: clientsServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ClientsComponent);
    component = fixture.componentInstance;
  });

  it('debería crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('debería cargar la lista de clientes en ngOnInit', () => {
    fixture.detectChanges();

    expect(clientsServiceSpy.getClients).toHaveBeenCalled();
    expect(component.clients.length).toBe(2);
    expect(component.clients[0].name).toBe('Daniela Rincon');
  });

  it('debería vaciar la lista de clientes y lanzar SweetAlert si hay error en la carga', () => {
    spyOn(Swal, 'fire');
    clientsServiceSpy.getClients.and.returnValue(throwError(() => new Error('Error de servidor')));

    fixture.detectChanges();

    expect(component.clients.length).toBe(0);
    expect(Swal.fire).toHaveBeenCalledWith('common.error', 'clients.loadError', 'error');
  });

  describe('onSubmit (Crear / Actualizar)', () => {
    it('debería mostrar advertencia si faltan campos requeridos', () => {
      spyOn(Swal, 'fire');
      fixture.detectChanges();

      component.client = { name: '', email: '', phone: '' };
      component.onSubmit();

      expect(Swal.fire).toHaveBeenCalledWith('common.error', 'clients.incomplete', 'warning');
    });

    it('debería crear un cliente exitosamente si no está editando', () => {
      spyOn(Swal, 'fire');
      fixture.detectChanges();

      const payload = { name: 'Carlos Gomez', email: 'carlos@mail.com', phone: '5551234' };
      component.client = payload;
      component.isEditing = false;

      clientsServiceSpy.createClient.and.returnValue(of({
        successful: true,
        status: 201,
        message: 'Creado',
        data: { id: 3, ...payload }
      }) as any);

      component.onSubmit();

      expect(clientsServiceSpy.createClient).toHaveBeenCalledWith(payload);
      expect(Swal.fire).toHaveBeenCalled();
    });

    it('debería llamar a updateClient si isEditing es true', () => {
      fixture.detectChanges();

      component.client = { name: 'Daniela Editada', email: 'daniela@mail.com', phone: '123456789' };
      component.isEditing = true;
      component.editClientId = 1;

      spyOn(component, 'updateClient');
      component.onSubmit();

      expect(component.updateClient).toHaveBeenCalled();
    });
  });

  describe('onEdit', () => {
    it('debería cargar los datos del cliente seleccionado en el formulario y activar modo edición', () => {
      fixture.detectChanges();

      const clienteAEditar = mockClientsList[1];
      component.onEdit(clienteAEditar);

      expect(component.isEditing).toBeTrue();
      expect(component.editClientId).toBe(clienteAEditar.id);
      expect(component.client.name).toBe(clienteAEditar.name);
      expect(component.modalOpen).toBeTrue();
    });
  });

  describe('onDelete', () => {
    it('debería eliminar al cliente si el usuario confirma la alerta', fakeAsync(() => {
      spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));
      clientsServiceSpy.deleteClient.and.returnValue(of(undefined) as any);
      fixture.detectChanges();

      const clienteAEliminar = component.clients[0];
      component.onDelete(clienteAEliminar);

      tick();

      expect(clientsServiceSpy.deleteClient).toHaveBeenCalledWith(clienteAEliminar.id!);
      expect(Swal.fire).toHaveBeenCalled();
    }));

    it('no debería eliminar al cliente si el usuario cancela la alerta', fakeAsync(() => {
      spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: false } as any));
      fixture.detectChanges();

      const clienteAEliminar = component.clients[0];
      component.onDelete(clienteAEliminar);

      tick();

      expect(clientsServiceSpy.deleteClient).not.toHaveBeenCalled();
      expect(component.clients.length).toBe(2);
    }));
  });

  describe('updateClient', () => {
    it('debería mapear y actualizar el cliente modificado en la lista', () => {
      spyOn(Swal, 'fire');
      fixture.detectChanges();

      component.editClientId = 1;
      const payload = { name: 'Daniela Rincon Modificada', email: 'daniela@mail.com', phone: '111111' };
      component.client = payload;

      clientsServiceSpy.updateClient.and.returnValue(of({
        successful: true,
        status: 200,
        message: 'Actualizado',
        data: { id: 1, ...payload }
      }) as any);

      component.updateClient();

      expect(clientsServiceSpy.updateClient).toHaveBeenCalledWith(1, payload);
      expect(component.isEditing).toBeFalse();
    });
  });

  describe('openNew', () => {
    it('debería resetear el formulario y apagar el modo edición', () => {
      fixture.detectChanges();

      component.isEditing = true;
      component.editClientId = 5;
      component.client = { name: 'Test', email: 'test@mail.com', phone: '123' };

      component.openNew();

      expect(component.isEditing).toBeFalse();
      expect(component.client.name).toBe('');
      expect(component.editClientId).toBeNull();
      expect(component.modalOpen).toBeTrue();
    });
  });
});
