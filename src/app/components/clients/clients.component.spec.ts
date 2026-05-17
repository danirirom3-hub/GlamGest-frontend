/// <reference types="jasmine" />

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ClientsComponent } from './clients.component';
import { ClientsService } from '../../services/clients.service';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';

describe('ClientsComponent', () => {
  // Variables principales tipadas explícitamente para evitar que el editor se confunda
  let component: ClientsComponent;
  let fixture: ComponentFixture<ClientsComponent>;
  let clientsServiceSpy: jasmine.SpyObj<ClientsService>;

  // Datos mock base para simular el backend
  const mockClientsList = [
    { id: 1, name: 'Daniela Rincon', email: 'daniela@mail.com', phone: '123456789' },
    { id: 2, name: 'Angie Sosa', email: 'angie@mail.com', phone: '987654321' }
  ];

  beforeEach(async () => {
    // Creamos el Spy simulando los métodos del servicio de clientes
    clientsServiceSpy = jasmine.createSpyObj('ClientsService', [
      'getClients',
      'createClient',
      'updateClient',
      'deleteClient'
    ]);

    // Respuesta por defecto para cuando se inicializa el componente
    clientsServiceSpy.getClients.and.returnValue(of({ data: mockClientsList }));

    await TestBed.configureTestingModule({
      imports: [ClientsComponent], // Al ser Standalone se importa directamente
      providers: [
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
    fixture.detectChanges(); // Esto dispara el ngOnInit

    expect(clientsServiceSpy.getClients).toHaveBeenCalled();
    expect(component.clients.length).toBe(2);
    expect(component.clients[0].name).toBe('Daniela Rincon');
  });

  it('debería vaciar la lista de clientes y lanzar SweetAlert si hay error en la carga', () => {
    spyOn(Swal, 'fire');
    clientsServiceSpy.getClients.and.returnValue(throwError(() => new Error('Error de servidor')));

    fixture.detectChanges();

    expect(component.clients.length).toBe(0);
    expect(Swal.fire).toHaveBeenCalledWith('Error', 'No se pudieron cargar los clientes.', 'error');
  });

  describe('onSubmit (Crear / Actualizar)', () => {
    it('debería mostrar advertencia si faltan campos requeridos', () => {
      spyOn(Swal, 'fire');
      fixture.detectChanges();

      component.client = { name: '', email: '', phone: '' }; // Campos vacíos
      component.onSubmit();

      expect(Swal.fire).toHaveBeenCalledWith('Campos incompletos', 'Completa todos los campos para guardar el cliente.', 'warning');
    });

    it('debería crear un cliente exitosamente si no está editando', () => {
      spyOn(Swal, 'fire');
      fixture.detectChanges();

      component.client = { name: 'Carlos Gomez', email: 'carlos@mail.com', phone: '5551234' };
      component.isEditing = false;

      const mockResponse = {
        successful: true,
        data: { id: 3, name: 'Carlos Gomez', email: 'carlos@mail.com', phone: '5551234' }
      };
      clientsServiceSpy.createClient.and.returnValue(of(mockResponse));

      component.onSubmit();

      expect(clientsServiceSpy.createClient).toHaveBeenCalledWith(component.client);
      expect(component.clients.length).toBe(3);
      expect(component.clients[2].name).toBe('Carlos Gomez');
      expect(Swal.fire).toHaveBeenCalled();
    });

    it('debería llamar a actualizarCliente si isEditing es true', () => {
      fixture.detectChanges();
      
      component.client = { name: 'Daniela Editada', email: 'daniela@mail.com', phone: '123456789' };
      component.isEditing = true;
      component.editClientId = 1;

      spyOn(component, 'actualizarCliente');
      component.onSubmit();

      expect(component.actualizarCliente).toHaveBeenCalled();
    });
  });

  describe('onEdit', () => {
    it('debería cargar los datos del cliente seleccionado en el formulario y activar modo edición', () => {
      spyOn(Swal, 'fire');
      fixture.detectChanges();

      const clienteAEditar = mockClientsList[1]; // Angie Sosa
      component.onEdit(clienteAEditar);

      expect(component.isEditing).toBeTrue();
      expect(component.editClientId).toBe(clienteAEditar.id);
      expect(component.client.name).toBe(clienteAEditar.name);
      expect(Swal.fire).toHaveBeenCalled();
    });
  });

  describe('onDelete', () => {
    it('debería eliminar al cliente si el usuario confirma la alerta', fakeAsync(() => {
      spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));
      clientsServiceSpy.deleteClient.and.returnValue(of({}));
      fixture.detectChanges();

      const clienteAEliminar = component.clients[0]; // Daniela Rincon
      component.onDelete(clienteAEliminar);

      tick(); // Resuelve la promesa de SweetAlert de forma síncrona

      expect(clientsServiceSpy.deleteClient).toHaveBeenCalledWith(clienteAEliminar.id!);
      expect(component.clients.length).toBe(1);
      expect(component.clients.some(c => c.id === clienteAEliminar.id)).toBeFalse();
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

  describe('actualizarCliente', () => {
    it('debería mapear y actualizar el cliente modificado en la lista', () => {
      spyOn(Swal, 'fire');
      fixture.detectChanges();

      component.editClientId = 1;
      component.client = { name: 'Daniela Rincon Modificada', email: 'daniela@mail.com', phone: '111111' };
      
      const mockResponse = {
        successful: true,
        data: { id: 1, name: 'Daniela Rincon Modificada', email: 'daniela@mail.com', phone: '111111' }
      };
      clientsServiceSpy.updateClient.and.returnValue(of(mockResponse));

      component.actualizarCliente();

      expect(clientsServiceSpy.updateClient).toHaveBeenCalledWith(1, component.client);
      expect(component.clients[0].name).toBe('Daniela Rincon Modificada');
      expect(component.isEditing).toBeFalse(); // Formulario reseteado
    });
  });

  describe('onNew', () => {
    it('debería resetear el formulario y apagar el modo edición', () => {
      spyOn(Swal, 'fire');
      fixture.detectChanges();

      component.isEditing = true;
      component.client = { name: 'Test', email: 'test@mail.com', phone: '123' };

      component.onNew();

      expect(component.isEditing).toBeFalse();
      expect(component.client.name).toBe('');
      expect(component.editClientId).toBeNull();
    });
  });
});