import {todolistsAPI, TodolistType} from 'api/todolists-api'
import {Dispatch} from 'redux'
import {appActions, RequestStatusType} from 'app/app-reducer'
import {handleServerNetworkError} from 'utils/error-utils'
import {AppThunk} from 'app/store';
import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {clearTasksAndTodolists} from "common/actions/common.actions";


const todoInitialState: TodolistDomainType[] = [];

const slice = createSlice({
    name: 'todo',
    initialState: todoInitialState,
    reducers: {
        removeTodolist: (state, action: PayloadAction<{ id: string }>) => {
            const index = state.findIndex((todo) => todo.id === action.payload.id);
            if (index !== -1) state.splice(index, 1);
            // return state.filter(tl => tl.id != action.payload.id)
        },
        addTodolist: (state, action: PayloadAction<{ todolist: TodolistType }>) => {
            const newTodo: TodolistDomainType = {
                ...action.payload.todolist,
                filter: 'all',
                entityStatus: 'idle',
            };
            state.unshift(newTodo);
            // return [{...action.payload.todolist, filter: 'all', entityStatus: 'idle'}, ...state]
        },
        changeTodolistTitle: (state, action: PayloadAction<{ id: string; title: string }>) => {
            const todo = state.find((todo) => todo.id === action.payload.id);
            if (todo) {
                todo.title = action.payload.title;
            }
            // return state.map(tl => tl.id === action.payload.id ? {...tl, title: action.payload.title} : tl)
        },
        changeTodolistFilter: (state, action: PayloadAction<{ id: string; filter: FilterValuesType }>) => {
            const todo = state.find((todo) => todo.id === action.payload.id);
            if (todo) {
                todo.filter = action.payload.filter;
            }
            // return state.map(tl => tl.id === action.payload.id ? {...tl, filter: action.payload.filter} : tl)
        },
        changeTodolistEntityStatus: (
            state,
            action: PayloadAction<{ id: string; entityStatus: RequestStatusType }>
        ) => {
            const todo = state.find((todo) => todo.id === action.payload.id);
            if (todo) {
                todo.entityStatus = action.payload.entityStatus;
            }
            // return state.map(tl => tl.id === action.payload.id ? {...tl, entityStatus: action.payload.status} : tl)
        },
        setTodolists: (state, action: PayloadAction<{ todolists: TodolistType[] }>) => {
            return action.payload.todolists.map((tl) => {
                return {...tl, filter: 'all', entityStatus: 'idle'};
            });
            // return [{...action.payload.todolist, filter: 'all', entityStatus: 'idle'}, ...state]
        },
    },
    extraReducers: (builder) => {
        builder.addCase(clearTasksAndTodolists, (state) => {
            return [];
        });
    },
});

// назвнание что в сторе у нас todolistsReducer
export const todolistsReducer = slice.reducer;
export const todolistsActions = slice.actions

// thunks
export const fetchTodolistsTC = (): AppThunk => {
    return (dispatch) => {
        dispatch(appActions.setAppStatus({status: 'loading'}))
        todolistsAPI.getTodolists()
            .then((res) => {
                dispatch(todolistsActions.setTodolists({todolists: res.data}))
                dispatch(appActions.setAppStatus({status: 'succeeded'}))
            })
            .catch(error => {
                handleServerNetworkError(error, dispatch);
            })
    }
}

export const removeTodolistTC = (id: string) => {
    return (dispatch: Dispatch) => {
        //изменим глобальный статус приложения, чтобы вверху полоса побежала
        dispatch(appActions.setAppStatus({status: 'loading'}))
        //изменим статус конкретного тудулиста, чтобы он мог задизеблить что надо
        dispatch(todolistsActions.changeTodolistEntityStatus({id, entityStatus: 'loading'}))
        todolistsAPI.deleteTodolist(id)
            .then((res) => {
                dispatch(todolistsActions.removeTodolist({id}))
                //скажем глобально приложению, что асинхронная операция завершена
                dispatch(appActions.setAppStatus({status: 'succeeded'}))
            })
    }
}

export const addTodolistTC = (title: string) => {
    return (dispatch: Dispatch) => {
        dispatch(appActions.setAppStatus({status: 'loading'}))
        todolistsAPI.createTodolist(title)
            .then((res) => {
                dispatch(todolistsActions.addTodolist({todolist: res.data.data.item}))
                dispatch(appActions.setAppStatus({status: 'succeeded'}))
            })
    }
}

export const changeTodolistTitleTC = (id: string, title: string) => {
    return (dispatch: Dispatch) => {
        todolistsAPI.updateTodolist(id, title)
            .then((res) => {
                dispatch(todolistsActions.changeTodolistTitle({id, title}))
            })
    }
}

// types
export type FilterValuesType = 'all' | 'active' | 'completed';

export type TodolistDomainType = TodolistType & {
    filter: FilterValuesType
    entityStatus: RequestStatusType
}
